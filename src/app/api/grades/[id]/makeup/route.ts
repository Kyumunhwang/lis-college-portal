import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { convertGradeToPoint, recalculateStudentGPAs } from "@/lib/gpa/calculator";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "VIEWER") {
      return NextResponse.json(
        { error: "Forbidden: Viewer cannot apply Credit Make-up" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { adjustedGrade, makeupReason, cancelMakeup } = body;

    const existingGrade = await prisma.courseGrade.findUnique({
      where: { id },
      include: {
        semesterRecord: {
          include: { student: true },
        },
      },
    });

    if (!existingGrade) {
      return NextResponse.json({ error: "Course grade not found" }, { status: 404 });
    }

    const studentId = existingGrade.semesterRecord.studentId;

    if (cancelMakeup) {
      // Revert Credit Make-up
      await prisma.courseGrade.update({
        where: { id },
        data: {
          isCreditMakeup: false,
          adjustedGrade: null,
          adjustedGradePoint: null,
          makeupReason: null,
        },
      });

      await prisma.gradeAuditLog.create({
        data: {
          courseGradeId: id,
          changedById: session.userId,
          previousValue: JSON.stringify({
            grade: existingGrade.adjustedGrade,
            point: existingGrade.adjustedGradePoint,
          }),
          newValue: JSON.stringify({
            grade: existingGrade.originalGrade,
            point: existingGrade.unweightedGradePoint,
          }),
          reason: "Credit Make-up 취소 및 원성적 복원",
        },
      });
    } else {
      // Apply Credit Make-up
      if (!adjustedGrade) {
        return NextResponse.json({ error: "Adjusted grade is required" }, { status: 400 });
      }

      const { gradePoint } = convertGradeToPoint(adjustedGrade);

      await prisma.courseGrade.update({
        where: { id },
        data: {
          isCreditMakeup: true,
          adjustedGrade: adjustedGrade.trim().toUpperCase(),
          adjustedGradePoint: gradePoint,
          makeupReason: makeupReason || "Credit Recovery / Summer School",
        },
      });

      await prisma.gradeAuditLog.create({
        data: {
          courseGradeId: id,
          changedById: session.userId,
          previousValue: JSON.stringify({
            grade: existingGrade.isCreditMakeup ? existingGrade.adjustedGrade : existingGrade.originalGrade,
            point: existingGrade.isCreditMakeup ? existingGrade.adjustedGradePoint : existingGrade.unweightedGradePoint,
          }),
          newValue: JSON.stringify({
            grade: adjustedGrade.trim().toUpperCase(),
            point: gradePoint,
          }),
          reason: makeupReason || "Credit Recovery / Make-up",
        },
      });
    }

    // Recalculate Student GPAs
    const allSemesters = await prisma.semesterRecord.findMany({
      where: { studentId },
      include: { courses: true },
    });

    const calcInput = allSemesters.map((s) => ({
      id: s.id,
      academicYear: s.academicYear,
      termName: s.termName,
      courses: s.courses.map((c) => ({
        id: c.id,
        category: c.category,
        credits: c.credits,
        originalGrade: c.originalGrade,
        unweightedGradePoint: c.unweightedGradePoint,
        isCreditMakeup: c.id === id ? !cancelMakeup : c.isCreditMakeup,
        adjustedGrade: c.id === id ? (cancelMakeup ? null : adjustedGrade.trim().toUpperCase()) : c.adjustedGrade,
        adjustedGradePoint: c.id === id ? (cancelMakeup ? null : convertGradeToPoint(adjustedGrade).gradePoint) : c.adjustedGradePoint,
        includeInGpa: c.includeInGpa,
      })),
    }));

    const calcResult = recalculateStudentGPAs(calcInput);

    for (const sem of calcResult.updatedSemesters) {
      await prisma.semesterRecord.update({
        where: { id: sem.id },
        data: {
          termGpa: sem.termGpa,
          termCoreGpa: sem.termCoreGpa,
          termCredits: sem.termCredits,
        },
      });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        cumulativeGpa: calcResult.cumulativeGpa,
        coreCumulativeGpa: calcResult.coreCumulativeGpa,
        cumulativeCredits: calcResult.cumulativeCredits,
      },
    });

    return NextResponse.json({
      success: true,
      message: cancelMakeup ? "Credit Make-up이 취소되었습니다." : "성적이 성공적으로 수정 및 반영되었습니다.",
      student: {
        id: updatedStudent.id,
        cumulativeGpa: updatedStudent.cumulativeGpa,
        coreCumulativeGpa: updatedStudent.coreCumulativeGpa,
      },
    });
  } catch (error) {
    console.error("Credit makeup error:", error);
    return NextResponse.json(
      { error: "Failed to apply Credit Make-up" },
      { status: 500 }
    );
  }
}
