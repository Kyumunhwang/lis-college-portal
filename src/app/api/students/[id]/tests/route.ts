export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

interface RouteParams {
  params: { id: string };
}

// POST: 공인 시험 성적 추가
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "COUNSELOR") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin and Counselor can edit standardized tests" },
        { status: 403 }
      );
    }

    const { id: studentId } = params;
    const body = await request.json();
    const { testType, totalScore, testDate, sectionScoresJson, notes } = body;

    if (!testType) {
      return NextResponse.json({ error: "Test type is required" }, { status: 400 });
    }

    const newTest = await prisma.standardizedTest.create({
      data: {
        studentId,
        testType: testType.trim(),
        totalScore: totalScore !== undefined && totalScore !== "" ? parseFloat(totalScore) : null,
        testDate: testDate ? new Date(testDate) : null,
        sectionScoresJson: sectionScoresJson ? (typeof sectionScoresJson === "string" ? sectionScoresJson : JSON.stringify(sectionScoresJson)) : null,
        notes: notes ? notes.trim() : null,
        isRepresentative: true,
      },
    });

    return NextResponse.json({ success: true, test: newTest });
  } catch (error) {
    console.error("Create test error:", error);
    return NextResponse.json(
      { error: "Failed to create standardized test" },
      { status: 500 }
    );
  }
}

// DELETE: 공인 시험 성적 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "COUNSELOR") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin and Counselor can delete standardized tests" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { testId } = body;

    if (!testId) {
      return NextResponse.json({ error: "Test ID is required" }, { status: 400 });
    }

    await prisma.standardizedTest.delete({
      where: { id: testId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete test error:", error);
    return NextResponse.json(
      { error: "Failed to delete standardized test" },
      { status: 500 }
    );
  }
}
