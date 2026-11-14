export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Keep-Alive Cron Endpoint
 * 
 * Periodically called by Vercel Cron and GitHub Actions to prevent
 * Supabase PostgreSQL project from entering inactive pause mode during
 * school vacations and long holidays (2~3 months).
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const tokenParam = searchParams.get("token");

    const expectedSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, enforce security check
    if (expectedSecret) {
      const isBearerValid = authHeader === `Bearer ${expectedSecret}`;
      const isTokenValid = tokenParam === expectedSecret;

      if (!isBearerValid && !isTokenValid) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid or missing cron secret" },
          { status: 401 }
        );
      }
    }

    // Execute lightweight database queries to keep Supabase active
    const [userCount, studentCount] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
    ]);

    const executionMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      status: "ACTIVE",
      timestamp: new Date().toISOString(),
      executionTimeMs: executionMs,
      message: "Supabase PostgreSQL keep-alive ping successful.",
      database: {
        totalUsers: userCount,
        totalStudents: studentCount,
      },
      source: authHeader ? "Vercel-Cron" : "External-Ping",
    });
  } catch (error: any) {
    console.error("Keep-alive cron error:", error);
    return NextResponse.json(
      {
        success: false,
        status: "ERROR",
        timestamp: new Date().toISOString(),
        error: error.message || "Failed to query database",
      },
      { status: 500 }
    );
  }
}
