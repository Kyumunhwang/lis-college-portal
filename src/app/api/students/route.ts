export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const gradeLevel = searchParams.get("grade");
    const status = searchParams.get("status");
    const graduationYear = searchParams.get("graduationYear");

    const where: any = {};

    if (query) {
      where.OR = [
        { studentCode: { contains: query } },
        { nameEn: { contains: query } },
        { nameKo: { contains: query } },
      ];
    }

    if (gradeLevel && gradeLevel !== "ALL") {
      where.gradeLevel = parseInt(gradeLevel, 10);
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (graduationYear && graduationYear !== "ALL") {
      where.graduationYear = parseInt(graduationYear, 10);
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { studentCode: "asc" },
      include: {
        _count: {
          select: {
            semesterRecords: true,
            counselingLogs: true,
            targetUniversities: true,
          },
        },
      },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Fetch students error:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
