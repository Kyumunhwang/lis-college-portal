import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

// GET: 교사 목록 조회
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "VIEWER") {
      return NextResponse.json(
        { error: "Forbidden: Viewer cannot access teacher management" },
        { status: 403 }
      );
    }

    const teachers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Fetch teachers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher accounts" },
      { status: 500 }
    );
  }
}

// POST: 신규 교사 계정 생성 (초기비번 1234, mustChangePassword: true)
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "VIEWER") {
      return NextResponse.json(
        { error: "Forbidden: Viewer cannot create teacher accounts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, role } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A teacher with this email already exists" },
        { status: 400 }
      );
    }

    // Default initial password is '1234' with mustChangePassword = true
    const defaultPasswordHash = await hashPassword("1234");
    const assignedRole = ["ADMIN", "COUNSELOR", "VIEWER"].includes(role) ? role : "VIEWER";

    const newTeacher = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: defaultPasswordHash,
        role: assignedRole,
        mustChangePassword: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, teacher: newTeacher }, { status: 201 });
  } catch (error) {
    console.error("Create teacher error:", error);
    return NextResponse.json(
      { error: "Failed to create teacher account" },
      { status: 500 }
    );
  }
}
