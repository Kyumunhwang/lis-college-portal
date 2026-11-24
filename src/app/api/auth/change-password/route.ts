import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/auth/rateLimit";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. 비밀번호 변경 시도 Rate Limit 검사
    const rateLimit = checkRateLimit(`change-pw:${session.userId}`, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      const waitMinutes = Math.ceil(rateLimit.resetSeconds / 60);
      return NextResponse.json(
        {
          error: `비밀번호 변경 시도 횟수를 초과했습니다. 계정 보호를 위해 ${waitMinutes}분 후에 다시 시도해 주십시오.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { error: "현재 비밀번호를 입력해 주십시오." },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "새 비밀번호는 최소 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "새 비밀번호는 기존 비밀번호와 달라야 합니다." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    // 2. 현재 비밀번호 필수 검증
    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      recordFailedAttempt(`change-pw:${session.userId}`, {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
      });

      return NextResponse.json(
        { error: "현재 비밀번호가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 3. 비밀번호 갱신 및 카운터 리셋
    resetRateLimit(`change-pw:${session.userId}`);
    const newHash = await hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    // Reissue updated session cookie without mustChangePassword flag
    const token = await createSessionToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role as "ADMIN" | "COUNSELOR" | "VIEWER",
      mustChangePassword: false,
    });

    const response = NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
