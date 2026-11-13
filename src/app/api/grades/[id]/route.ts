import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { convertGradeToPoint, recalculateStudentGPAs } from "@/lib/gpa/calculator";
import { evaluateAndApplyPromotion } from "@/lib/academic/promotion";

interface RouteParams {
  params: { id: string };
}

// Helper to recalculate and update student GPAs and evaluate grade promotion
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

// PUT /api/grades/[id] - Edit entire course details
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: 오직 ADMIN 및 COUNSELOR만 과목 성적 수정 가능 (VIEWER 차단)
    if (session.role !== "ADMIN" && session.role !== "COUNSELOR") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin and Counselor can edit course details" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const {
      courseTitle,
      category,
      credits,
      originalGrade,
      isCreditMakeup,
      adjustedGrade,
      makeupReason,
      includeInGpa,
    } = body;

    const existing = await prisma.courseGrade.findUnique({
      where: { id },
      include: { semesterRecord: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const origGrade = originalGrade !== undefined ? originalGrade.trim().toUpperCase() : existing.originalGrade;
    const { gradePoint: origPoint } = convertGradeToPoint(origGrade);

    let adjPoint: number | null = null;
    if (isCreditMakeup && adjustedGrade) {
      const p = convertGradeToPoint(adjustedGrade.trim().toUpperCase());
      adjPoint = p.gradePoint;
    }

    const updated = await prisma.courseGrade.update({
      where: { id },
      data: {
        courseTitle: courseTitle !== undefined ? courseTitle.trim() : existing.courseTitle,
        category: category !== undefined ? category : existing.category,
        credits: credits !== undefined ? parseFloat(credits) : existing.credits,
        originalGrade: origGrade,
        unweightedGradePoint: origPoint,
        isCreditMakeup: isCreditMakeup !== undefined ? !!isCreditMakeup : existing.isCreditMakeup,
        adjustedGrade: isCreditMakeup && adjustedGrade ? adjustedGrade.trim().toUpperCase() : null,
        adjustedGradePoint: adjPoint,
        makeupReason: isCreditMakeup && makeupReason ? makeupReason.trim() : null,
        includeInGpa: includeInGpa !== undefined ? !!includeInGpa : existing.includeInGpa,
      },
    });

    // Recalculate GPAs
    const gpaResult = await syncStudentGpas(existing.semesterRecord.studentId);

    return NextResponse.json({ course: updated, gpaResult, success: true });
  } catch (error) {
    console.error("Update course grade error:", error);
    return NextResponse.json(
      { error: "Failed to update course grade" },
      { status: 500 }
    );
  }
}

// DELETE /api/grades/[id] - Delete a course and recalculate GPAs
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: 오직 ADMIN 및 COUNSELOR만 과목 삭제 가능 (VIEWER 차단)
    if (session.role !== "ADMIN" && session.role !== "COUNSELOR") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin and Counselor can delete course" },
        { status: 403 }
      );
    }

    const { id } = params;
    const existing = await prisma.courseGrade.findUnique({
      where: { id },
      include: { semesterRecord: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const studentId = existing.semesterRecord.studentId;

    // Delete audit logs first
    await prisma.gradeAuditLog.deleteMany({ where: { courseGradeId: id } });
    await prisma.courseGrade.delete({ where: { id } });

    // Recalculate GPAs
    const gpaResult = await syncStudentGpas(studentId);

    return NextResponse.json({ success: true, gpaResult });
  } catch (error) {
    console.error("Delete course grade error:", error);
    return NextResponse.json(
      { error: "Failed to delete course grade" },
      { status: 500 }
    );
  }
}
