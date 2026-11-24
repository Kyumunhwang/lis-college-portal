import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { evaluateAndApplyPromotion } from "@/lib/academic/promotion";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: 오직 ADMIN 및 COUNSELOR만 학기 추가 가능 (VIEWER 차단)
    if (session.role !== "ADMIN" && session.role !== "COUNSELOR") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin and Counselor can add semester" },
        { status: 403 }
      );
    }

    const { id: studentId } = params;

    // 학생 존재 확인
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await request.json();
    const { academicYear, termName, gradeLevel } = body;

    if (!academicYear || !termName) {
      return NextResponse.json(
        { error: "academicYear and termName are required" },
        { status: 400 }
      );
    }

    let parsedGrade = 12;
    if (gradeLevel !== undefined && gradeLevel !== null && gradeLevel !== "") {
      const g = parseInt(gradeLevel, 10);
      if (isNaN(g) || g < 9 || g > 12) {
        return NextResponse.json(
          { error: "학기 학년(gradeLevel)은 9 ~ 12 범위여야 합니다." },
          { status: 400 }
        );
      }
      parsedGrade = g;
    }

    const newSemester = await prisma.semesterRecord.create({
      data: {
        studentId,
        academicYear: academicYear.trim(),
        termName: termName.trim(),
        gradeLevel: parsedGrade,
        termGpa: 0,
        termCoreGpa: 0,
        termCredits: 0,
      },
    });

    // 봄학기(Semester 2) 추가 시 학년 자동 진급 평가 및 반영
    await evaluateAndApplyPromotion(studentId);

    return NextResponse.json({ semester: newSemester, success: true });
  } catch (error) {
    console.error("Add semester error:", error);
    return NextResponse.json(
      { error: "Failed to add semester" },
      { status: 500 }
    );
  }
}
