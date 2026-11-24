export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

interface RouteParams {
  params: { id: string };
}

// PATCH: 상담 상태(SCHEDULED/COMPLETED), 긴급(isUrgent), 다음 상담일정(nextCounselDate) 수정
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden: Viewer cannot edit counseling logs" }, { status: 403 });
    }

    const { id } = params;

    // 1. 상담 일지 존재 및 권한(IDOR 방어) 검증
    const existingLog = await prisma.counselingLog.findUnique({
      where: { id },
      select: { id: true, counselorId: true, isConfidential: true },
    });

    if (!existingLog) {
      return NextResponse.json({ error: "상담 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      content,
      category,
      counselDate,
      withParent,
      isConfidential,
      status,
      isUrgent,
      nextCounselDate,
      actionItems,
    } = body;

    // 상세 내용(제목, 본문, 안건 등) 수정 또는 비공개 상담인 경우, 작성자 본인 또는 ADMIN만 수정 가능
    const isContentEditing =
      title !== undefined ||
      content !== undefined ||
      category !== undefined ||
      isConfidential !== undefined;

    const isAuthorOrAdmin =
      session.role === "ADMIN" || existingLog.counselorId === session.userId;

    if (existingLog.isConfidential && !isAuthorOrAdmin) {
      return NextResponse.json(
        { error: "비공개 상담 기록은 작성자 및 관리자만 수정할 수 있습니다." },
        { status: 403 }
      );
    }

    if (isContentEditing && !isAuthorOrAdmin) {
      return NextResponse.json(
        { error: "다른 상담사의 상담 일지 본문 및 안건은 작성자 및 관리자만 수정할 수 있습니다." },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (counselDate !== undefined) {
      updateData.counselDate = counselDate ? new Date(counselDate) : new Date();
    }
    if (withParent !== undefined) updateData.withParent = Boolean(withParent);
    if (isConfidential !== undefined) updateData.isConfidential = Boolean(isConfidential);
    if (status !== undefined) updateData.status = status;
    if (isUrgent !== undefined) updateData.isUrgent = Boolean(isUrgent);
    if (nextCounselDate !== undefined) {
      updateData.nextCounselDate = nextCounselDate ? new Date(nextCounselDate) : null;
    }
    if (actionItems !== undefined) {
      updateData.actionItems =
        typeof actionItems === "string"
          ? actionItems
          : actionItems
          ? JSON.stringify(actionItems)
          : null;
    }

    const updated = await prisma.counselingLog.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { id: true, studentCode: true, nameEn: true, nameKo: true, gradeLevel: true } },
        counselor: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, log: updated });
  } catch (error) {
    console.error("Update counseling error:", error);
    return NextResponse.json({ error: "Failed to update counseling" }, { status: 500 });
  }
}

// DELETE: 상담 일지 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden: Viewer cannot delete counseling logs" }, { status: 403 });
    }

    const { id } = params;

    // 1. 존재 확인 및 작성자/관리자 권한(IDOR 방어) 검증
    const existingLog = await prisma.counselingLog.findUnique({
      where: { id },
      select: { id: true, counselorId: true },
    });

    if (!existingLog) {
      return NextResponse.json({ error: "상담 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    if (session.role !== "ADMIN" && existingLog.counselorId !== session.userId) {
      return NextResponse.json(
        { error: "상담 일지 삭제는 작성자 본인 또는 관리자만 가능합니다." },
        { status: 403 }
      );
    }

    await prisma.counselingLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete counseling error:", error);
    return NextResponse.json({ error: "Failed to delete counseling" }, { status: 500 });
  }
}
