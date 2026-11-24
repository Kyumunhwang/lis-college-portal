export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        semesterRecords: {
          include: {
            courses: {
              include: {
                auditLogs: {
                  include: { changedBy: { select: { name: true } } },
                },
              },
            },
          },
          orderBy: [{ academicYear: "asc" }, { termName: "asc" }],
        },
        standardizedTests: {
          orderBy: { testDate: "desc" },
        },
        clubActivities: {
          orderBy: [{ semester: "desc" }, { createdAt: "desc" }],
        },
        awardRecords: {
          orderBy: { awardDate: "desc" },
        },
        counselingLogs: {
          include: { counselor: { select: { name: true, email: true } } },
          orderBy: { counselDate: "desc" },
        },
        targetUniversities: {
          orderBy: [{ proposerType: "asc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // RBAC: VIEWER (일반교사)는 상담일지를 보거나 쓸 수 없으므로 비움 처리
    if (session.role === "VIEWER") {
      student.counselingLogs = [];
    }

    return NextResponse.json({ student, currentUserRole: session.role });
  } catch (error) {
    console.error("Fetch student details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student details" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: 오직 ADMIN 및 COUNSELOR만 수정 가능 (VIEWER는 차단)
    if (session.role !== "ADMIN" && session.role !== "COUNSELOR") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin and Counselor can edit student profile" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const updateData: any = {};

    if (body.nameKo !== undefined) updateData.nameKo = body.nameKo ? body.nameKo.trim() : null;
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn ? body.nameEn.trim() : "";

    // 학년 수치 및 범위 검증 (9 ~ 12)
    if (body.gradeLevel !== undefined) {
      const g = parseInt(body.gradeLevel, 10);
      if (isNaN(g) || g < 9 || g > 12) {
        return NextResponse.json(
          { error: "학년(gradeLevel)은 9 ~ 12 범위여야 합니다." },
          { status: 400 }
        );
      }
      updateData.gradeLevel = g;
    }

    // 학적 상태 검증
    if (body.status !== undefined) {
      const allowedStatuses = ["ENROLLED", "LEAVE_OF_ABSENCE", "WITHDRAWAL", "GRADUATED"];
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "유효하지 않은 학적 상태입니다. (ENROLLED, LEAVE_OF_ABSENCE, WITHDRAWAL, GRADUATED 허용)" },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    // 졸업 연도 범위 검증 (2000 ~ 2100)
    if (body.graduationYear !== undefined) {
      if (body.graduationYear) {
        const y = parseInt(body.graduationYear, 10);
        if (isNaN(y) || y < 2000 || y > 2100) {
          return NextResponse.json(
            { error: "졸업 연도(graduationYear)는 2000 ~ 2100 범위여야 합니다." },
            { status: 400 }
          );
        }
        updateData.graduationYear = y;
      } else {
        updateData.graduationYear = null;
      }
    }
    if (body.graduationDate !== undefined) {
      updateData.graduationDate = body.graduationDate ? new Date(body.graduationDate) : null;
    }
    if (body.withdrawalDate !== undefined) {
      updateData.withdrawalDate = body.withdrawalDate ? new Date(body.withdrawalDate) : null;
    }
    if (body.entryDate !== undefined) {
      updateData.entryDate = body.entryDate ? new Date(body.entryDate) : null;
    }
    if (body.birthDate !== undefined) {
      updateData.birthDate = body.birthDate ? new Date(body.birthDate) : null;
    }
    if (body.gender !== undefined) updateData.gender = body.gender || null;
    if (body.parentName !== undefined) updateData.parentName = body.parentName || null;
    if (body.parentContact !== undefined) updateData.parentContact = body.parentContact || null;
    if (body.address !== undefined) updateData.address = body.address || null;

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ student: updatedStudent, success: true });
  } catch (error) {
    console.error("Update student profile error:", error);
    return NextResponse.json(
      { error: "Failed to update student profile" },
      { status: 500 }
    );
  }
}
