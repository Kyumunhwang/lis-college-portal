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

    const trimmedType = testType.trim();

    // 점수 수치 및 시험별 범위 검증
    let validatedScore: number | null = null;
    if (totalScore !== undefined && totalScore !== "" && totalScore !== null) {
      const scoreNum = parseFloat(totalScore);
      if (isNaN(scoreNum) || !isFinite(scoreNum) || scoreNum < 0) {
        return NextResponse.json(
          { error: "시험 점수는 0 이상의 올바른 숫자여야 합니다." },
          { status: 400 }
        );
      }

      if (trimmedType === "New TOEFL iBT" && (scoreNum < 1.0 || scoreNum > 6.0)) {
        return NextResponse.json(
          { error: "New TOEFL iBT 점수는 1.0 ~ 6.0 밴드 스케일 범위여야 합니다." },
          { status: 400 }
        );
      }
      if (trimmedType === "TOEFL iBT" && (scoreNum < 0 || scoreNum > 120)) {
        return NextResponse.json(
          { error: "TOEFL iBT 점수는 0 ~ 120 범위여야 합니다." },
          { status: 400 }
        );
      }
      if (trimmedType === "SAT" && (scoreNum < 400 || scoreNum > 1600)) {
        return NextResponse.json(
          { error: "SAT 점수는 400 ~ 1600 범위여야 합니다." },
          { status: 400 }
        );
      }
      if (trimmedType === "ACT" && (scoreNum < 1 || scoreNum > 36)) {
        return NextResponse.json(
          { error: "ACT 점수는 1 ~ 36 범위여야 합니다." },
          { status: 400 }
        );
      }
      if (trimmedType.startsWith("AP ") && (scoreNum < 1 || scoreNum > 5)) {
        return NextResponse.json(
          { error: "AP 시험 점수는 1 ~ 5 범위여야 합니다." },
          { status: 400 }
        );
      }
      if (trimmedType === "Duolingo English Test (DET)" && (scoreNum < 10 || scoreNum > 160)) {
        return NextResponse.json(
          { error: "Duolingo 점수는 10 ~ 160 범위여야 합니다." },
          { status: 400 }
        );
      }
      if (trimmedType === "IELTS" && (scoreNum < 0 || scoreNum > 9.0)) {
        return NextResponse.json(
          { error: "IELTS 점수는 0.0 ~ 9.0 범위여야 합니다." },
          { status: 400 }
        );
      }
      if (scoreNum > 2400) {
        return NextResponse.json(
          { error: "시험 점수가 비정상적으로 큽니다 (최대 2400 이하)." },
          { status: 400 }
        );
      }

      validatedScore = scoreNum;
    }

    const newTest = await prisma.standardizedTest.create({
      data: {
        studentId,
        testType: trimmedType,
        totalScore: validatedScore,
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

    const existingTest = await prisma.standardizedTest.findUnique({
      where: { id: testId },
      select: { studentId: true },
    });

    if (!existingTest || existingTest.studentId !== params.id) {
      return NextResponse.json(
        { error: "해당 학생의 공인 시험 성적을 찾을 수 없습니다." },
        { status: 404 }
      );
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
