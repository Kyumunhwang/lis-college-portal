import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

interface RouteParams {
  params: { id: string };
}

// PATCH: 교사 비밀번호 초기화 (1234) 또는 권한 변경
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { action, role } = body;

    const teacher = await prisma.user.findUnique({ where: { id } });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // 1. Password Reset Action
    if (action === "reset-password") {
      const resetHash = await hashPassword("1234");
      await prisma.user.update({
        where: { id },
        data: {
          passwordHash: resetHash,
          mustChangePassword: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "비밀번호가 1234로 초기화되었습니다. 최초 로그인 시 변경이 강제됩니다.",
      });
    }

    // 2. Role Update Action
    if (role && ["ADMIN", "COUNSELOR", "VIEWER"].includes(role)) {
      // Prevent demoting the primary admin account if needed
      const updated = await prisma.user.update({
        where: { id },
        data: { role },
      });
      return NextResponse.json({ success: true, teacher: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update teacher error:", error);
    return NextResponse.json(
      { error: "Failed to update teacher" },
      { status: 500 }
    );
  }
}

// DELETE: 교사 계정 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    // Prevent deleting self
    if (session.userId === id) {
      return NextResponse.json(
        { error: "현재 로그인된 본인 계정은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // Prevent deleting master admin
    const target = await prisma.user.findUnique({ where: { id } });
    if (target?.email === "kyumun.hwang@gmail.com") {
      return NextResponse.json(
        { error: "최고 관리자(Master Admin) 계정은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "교사 계정이 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("Delete teacher error:", error);
    return NextResponse.json(
      { error: "Failed to delete teacher" },
      { status: 500 }
    );
  }
}
