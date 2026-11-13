export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

interface RouteParams {
  params: { id: string };
}

// POST: 동아리(CLUB) 또는 수상(AWARD) 등록
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "COUNSELOR") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin and Counselor can add activities" },
        { status: 403 }
      );
    }

    const { id: studentId } = params;
    const body = await request.json();
    const { type, clubName, role, yearsActive, description, awardTitle, awardType, awardDate, issuer } = body;

    if (type === "CLUB") {
      if (!clubName) {
        return NextResponse.json({ error: "Club name is required" }, { status: 400 });
      }
      const club = await prisma.clubActivity.create({
        data: {
          studentId,
          clubName: clubName.trim(),
          role: role ? role.trim() : "Member",
          yearsActive: yearsActive ? yearsActive.trim() : "10, 11",
          description: description ? description.trim() : null,
        },
      });
      return NextResponse.json({ success: true, club });
    } else if (type === "AWARD") {
      if (!awardTitle) {
        return NextResponse.json({ error: "Award title is required" }, { status: 400 });
      }
      const award = await prisma.awardRecord.create({
        data: {
          studentId,
          awardTitle: awardTitle.trim(),
          awardType: awardType ? awardType.trim() : "INTERNAL",
          awardDate: awardDate ? new Date(awardDate) : null,
          issuer: issuer ? issuer.trim() : null,
        },
      });
      return NextResponse.json({ success: true, award });
    }

    return NextResponse.json({ error: "Invalid activity type" }, { status: 400 });
  } catch (error) {
    console.error("Create activity error:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}

// DELETE: 동아리(CLUB) 또는 수상(AWARD) 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "COUNSELOR") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin and Counselor can delete activities" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, itemId } = body;

    if (!itemId || !type) {
      return NextResponse.json({ error: "Item ID and type are required" }, { status: 400 });
    }

    if (type === "CLUB") {
      await prisma.clubActivity.delete({ where: { id: itemId } });
      return NextResponse.json({ success: true });
    } else if (type === "AWARD") {
      await prisma.awardRecord.delete({ where: { id: itemId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Delete activity error:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 }
    );
  }
}
