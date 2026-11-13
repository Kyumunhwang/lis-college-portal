export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

interface RouteParams {
  params: { id: string };
}

// POST: 새 진학상담 기록 작성
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "VIEWER") {
      return NextResponse.json(
        { error: "Forbidden: Viewer cannot add counseling logs" },
        { status: 403 }
      );
    }

    const { id: studentId } = params;
    const body = await request.json();
    const {
      category,
      counselDate,
      withParent,
      title,
      content,
      actionItems,
      isConfidential,
      status,
      nextCounselDate,
      isUrgent,
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const log = await prisma.counselingLog.create({
      data: {
        studentId,
        counselorId: session.userId,
        category: category || "정기진학상담",
        counselDate: counselDate ? new Date(counselDate) : new Date(),
        withParent: Boolean(withParent),
        title,
        content,
        actionItems: actionItems ? JSON.stringify(actionItems) : null,
        isConfidential: Boolean(isConfidential),
        // 기본값은 '상담하지 않음/상담 전(SCHEDULED)'
        status: status || "SCHEDULED",
        isUrgent: Boolean(isUrgent),
        nextCounselDate: nextCounselDate ? new Date(nextCounselDate) : null,
      },
      include: {
        counselor: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Create counseling log error:", error);
    return NextResponse.json(
      { error: "Failed to create counseling log" },
      { status: 500 }
    );
  }
}

// PATCH: Action item 토글 또는 상담 상태/일정 수정
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { logId, actionItems, status, nextCounselDate, isUrgent } = body;

    if (!logId) {
      return NextResponse.json({ error: "Log ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (actionItems !== undefined) {
      updateData.actionItems = actionItems ? JSON.stringify(actionItems) : null;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (isUrgent !== undefined) {
      updateData.isUrgent = Boolean(isUrgent);
    }
    if (nextCounselDate !== undefined) {
      updateData.nextCounselDate = nextCounselDate ? new Date(nextCounselDate) : null;
    }

    const updated = await prisma.counselingLog.update({
      where: { id: logId },
      data: updateData,
      include: {
        counselor: { select: { name: true, email: true } },
        student: { select: { id: true, studentCode: true, nameEn: true, nameKo: true, gradeLevel: true } },
      },
    });

    return NextResponse.json({ success: true, log: updated });
  } catch (error) {
    console.error("Update counseling log error:", error);
    return NextResponse.json(
      { error: "Failed to update counseling log" },
      { status: 500 }
    );
  }
}
