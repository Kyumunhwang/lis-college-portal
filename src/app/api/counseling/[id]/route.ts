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
    const body = await request.json();
    const { status, isUrgent, nextCounselDate, actionItems } = body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (isUrgent !== undefined) updateData.isUrgent = Boolean(isUrgent);
    if (nextCounselDate !== undefined) {
      updateData.nextCounselDate = nextCounselDate ? new Date(nextCounselDate) : null;
    }
    if (actionItems !== undefined) {
      updateData.actionItems = actionItems ? JSON.stringify(actionItems) : null;
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
    await prisma.counselingLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete counseling error:", error);
    return NextResponse.json({ error: "Failed to delete counseling" }, { status: 500 });
  }
}
