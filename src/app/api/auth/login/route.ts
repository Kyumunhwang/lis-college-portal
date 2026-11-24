import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/auth/rateLimit";

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15분
const MAX_EMAIL_ATTEMPTS = 5;            // 계정별 최대 5회 실패 허용
const MAX_IP_ATTEMPTS = 15;              // IP별 최대 15회 실패 허용

export async function POST(request: Request) {
  try {
    const forwardedHeader = request.headers.get("x-forwarded-for");
    const ip = forwardedHeader
      ? forwardedHeader.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "anonymous";

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 모두 입력해 주십시오." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. IP 및 계정별 Rate Limit 검사
    const ipLimit = checkRateLimit(`ip:${ip}`, {
      maxAttempts: MAX_IP_ATTEMPTS,
      windowMs: LOGIN_WINDOW_MS,
    });
    const emailLimit = checkRateLimit(`email:${normalizedEmail}`, {
      maxAttempts: MAX_EMAIL_ATTEMPTS,
      windowMs: LOGIN_WINDOW_MS,
    });

    if (!ipLimit.allowed || !emailLimit.allowed) {
      const waitSeconds = Math.max(ipLimit.resetSeconds, emailLimit.resetSeconds);
      const waitMinutes = Math.ceil(waitSeconds / 60);

      return NextResponse.json(
        {
          error: `로그인 시도 가능 횟수를 초과했습니다. 계정 보안을 위해 약 ${waitMinutes}분 후에 다시 시도해 주십시오.`,
          retryAfter: waitSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": waitSeconds.toString(),
          },
        }
      );
    }

    // 2. 사용자 계정 조회
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      recordFailedAttempt(`ip:${ip}`, { maxAttempts: MAX_IP_ATTEMPTS, windowMs: LOGIN_WINDOW_MS });
      recordFailedAttempt(`email:${normalizedEmail}`, { maxAttempts: MAX_EMAIL_ATTEMPTS, windowMs: LOGIN_WINDOW_MS });
      // 시간차 공격(Timing Attack) 완화를 위한 인공 지연
      await new Promise((resolve) => setTimeout(resolve, 300));

      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 3. 비밀번호 검증
    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      recordFailedAttempt(`ip:${ip}`, { maxAttempts: MAX_IP_ATTEMPTS, windowMs: LOGIN_WINDOW_MS });
      recordFailedAttempt(`email:${normalizedEmail}`, { maxAttempts: MAX_EMAIL_ATTEMPTS, windowMs: LOGIN_WINDOW_MS });
      await new Promise((resolve) => setTimeout(resolve, 300));

      const remaining = emailLimit.remaining - 1;
      const warning = remaining > 0 && remaining <= 3
        ? ` (${remaining}회 실패 시 계정이 일시 잠금됩니다)`
        : "";

      return NextResponse.json(
        { error: `이메일 또는 비밀번호가 올바르지 않습니다.${warning}` },
        { status: 401 }
      );
    }

    // 4. 로그인 성공 시 카운터 초기화
    resetRateLimit(`ip:${ip}`);
    resetRateLimit(`email:${normalizedEmail}`);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "COUNSELOR" | "VIEWER",
      mustChangePassword: user.mustChangePassword,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "로그인 처리 중 예기치 않은 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
