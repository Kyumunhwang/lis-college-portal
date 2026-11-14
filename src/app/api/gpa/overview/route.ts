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
    const studentId = searchParams.get("studentId");

    // Get all students for selector
    const students = await prisma.student.findMany({
      select: {
        id: true,
        studentCode: true,
        nameEn: true,
        nameKo: true,
        gradeLevel: true,
        status: true,
        graduationYear: true,
        cumulativeGpa: true,
        coreCumulativeGpa: true,
      },
      orderBy: [{ gradeLevel: "asc" }, { studentCode: "asc" }],
    });

    const activeStudentId = studentId || (students.length > 0 ? students[0].id : null);

    if (!activeStudentId) {
      return NextResponse.json({ students: [], student: null, semesters: [] });
    }

    const student = await prisma.student.findUnique({
      where: { id: activeStudentId },
      include: {
        semesterRecords: {
          include: {
            courses: {
              include: { auditLogs: { include: { changedBy: true } } },
            },
          },
          orderBy: [{ academicYear: "asc" }, { termName: "asc" }],
        },
      },
    });

    return NextResponse.json({
      students,
      student,
      semesters: student?.semesterRecords || [],
    });
  } catch (error) {
    console.error("GPA overview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GPA overview data" },
      { status: 500 }
    );
  }
}
