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
    const body = await request.json();
    const { academicYear, termName, gradeLevel } = body;

    if (!academicYear || !termName) {
      return NextResponse.json(
        { error: "academicYear and termName are required" },
        { status: 400 }
      );
    }

    const newSemester = await prisma.semesterRecord.create({
      data: {
        studentId,
        academicYear: academicYear.trim(),
        termName: termName.trim(),
        gradeLevel: gradeLevel ? parseInt(gradeLevel, 10) : 12,
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
