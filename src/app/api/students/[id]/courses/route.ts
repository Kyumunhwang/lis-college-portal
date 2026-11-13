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

    const grade = originalGrade.trim().toUpperCase();
    const { gradePoint, includeInGpa: defaultInclude } = convertGradeToPoint(grade);
    const assignedCategory = category || classifySubjectCategory(courseTitle);

    const newCourse = await prisma.courseGrade.create({
      data: {
        semesterRecordId,
        courseTitle: courseTitle.trim(),
        category: assignedCategory,
        credits: credits ? parseFloat(credits) : 0.5,
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
