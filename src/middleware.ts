import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public assets, login, and keep-alive health/cron routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/cron/keep-alive") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname === "/manifest.json" ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".webmanifest")
  ) {
    return NextResponse.next();
  }

  // 2. Allow login page
  if (pathname === "/login") {
    const session = await verifySessionToken(request);
    if (session) {
      if (session.mustChangePassword) {
        return NextResponse.redirect(new URL("/change-password", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 3. Authenticate private routes
  const session = await verifySessionToken(request);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Force password change if required
  if (session.mustChangePassword) {
    const allowedForPasswordChange = [
      "/change-password",
      "/api/auth/change-password",
      "/api/auth/logout",
      "/api/auth/me",
    ];
    if (!allowedForPasswordChange.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }
    return NextResponse.next();
  }

  // If password change is not required but user is on /change-password, redirect to /dashboard
  if (pathname === "/change-password") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 5. RBAC Guard for Admin & Counselor only routes (/teachers, /transcript-parser, /extra-analytics)
  const isCounselorOrAdminOnly =
    pathname.startsWith("/teachers") ||
    pathname.startsWith("/api/teachers") ||
    pathname.startsWith("/transcript-parser") ||
    pathname.startsWith("/extra-analytics");

  if (isCounselorOrAdminOnly) {
    if (session.role === "VIEWER") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden: Viewer role cannot access this resource" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
