import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { convertGradeToPoint, recalculateStudentGPAs } from "@/lib/gpa/calculator";
import { classifySubjectCategory } from "@/lib/gpa/classifier";
import { evaluateAndApplyPromotion } from "@/lib/academic/promotion";

interface RouteParams {
  params: { id: string };
}

async function syncStudentGpas(studentId: string) {
  const studentSemesters = await prisma.semesterRecord.findMany({
    where: { studentId },
    include: { courses: true },
  });

  const calcInput = studentSemesters.map((s) => ({
    id: s.id,
    academicYear: s.academicYear,
    termName: s.termName,
    courses: s.courses.map((c) => ({
      id: c.id,
      category: c.category,
      credits: c.credits,
      originalGrade: c.originalGrade,
      unweightedGradePoint: c.unweightedGradePoint,
      isCreditMakeup: c.isCreditMakeup,
      adjustedGrade: c.adjustedGrade,
      adjustedGradePoint: c.adjustedGradePoint,
      includeInGpa: c.includeInGpa,
    })),
  }));

  const calcResult = recalculateStudentGPAs(calcInput);

  for (const uSem of calcResult.updatedSemesters) {
    await prisma.semesterRecord.update({
      where: { id: uSem.id },
      data: {
        termGpa: uSem.termGpa,
        termCoreGpa: uSem.termCoreGpa,
        termCredits: uSem.termCredits,
      },
    });
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      cumulativeGpa: calcResult.cumulativeGpa,
      coreCumulativeGpa: calcResult.coreCumulativeGpa,
      cumulativeCredits: calcResult.cumulativeCredits,
    },
  });

  // 봄학기(Semester 2) 성적 업데이트 시 미국 커리큘럼 학년 자동 진급 평가 및 반영
  await evaluateAndApplyPromotion(studentId);

  return calcResult;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: 오직 ADMIN 및 COUNSELOR만 과목 추가 가능 (VIEWER 차단)
    if (session.role !== "ADMIN" && session.role !== "COUNSELOR") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin and Counselor can add course" },
        { status: 403 }
      );
    }

    const { id: studentId } = params;
    const body = await request.json();
    const { semesterRecordId, courseTitle, category, credits, originalGrade, includeInGpa } = body;

    if (!semesterRecordId || !courseTitle || !originalGrade) {
      return NextResponse.json(
        { error: "semesterRecordId, courseTitle, and originalGrade are required" },
        { status: 400 }
      );
    }

    // Verify semesterRecordId belongs to the URL studentId (IDOR Prevention)
    const semester = await prisma.semesterRecord.findUnique({
      where: { id: semesterRecordId },
      select: { studentId: true },
    });

    if (!semester || semester.studentId !== studentId) {
      return NextResponse.json(
        { error: "해당 학생의 학기 기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const grade = originalGrade.trim().toUpperCase();
    const { gradePoint, includeInGpa: defaultInclude } = convertGradeToPoint(grade);
    const assignedCategory = category || classifySubjectCategory(courseTitle);

    // 학점(credits) 수치 및 범위 검증 (0.0 ~ 5.0)
    let validatedCredits = 0.5;
    if (credits !== undefined && credits !== null && credits !== "") {
      const parsedCredits = parseFloat(credits);
      if (isNaN(parsedCredits) || !isFinite(parsedCredits) || parsedCredits < 0 || parsedCredits > 5.0) {
        return NextResponse.json(
          { error: "이수 학점(credits)은 0.0 ~ 5.0 범위의 올바른 수치여야 합니다." },
          { status: 400 }
        );
      }
      validatedCredits = parsedCredits;
    }

    const newCourse = await prisma.courseGrade.create({
      data: {
        semesterRecordId,
        courseTitle: courseTitle.trim(),
        category: assignedCategory,
        credits: validatedCredits,
        originalGrade: grade,
        unweightedGradePoint: gradePoint,
        includeInGpa: includeInGpa !== undefined ? !!includeInGpa : defaultInclude,
      },
    });

    const gpaResult = await syncStudentGpas(studentId);

    return NextResponse.json({ course: newCourse, gpaResult, success: true });
  } catch (error) {
    console.error("Add course error:", error);
    return NextResponse.json(
      { error: "Failed to add course" },
      { status: 500 }
    );
  }
}
