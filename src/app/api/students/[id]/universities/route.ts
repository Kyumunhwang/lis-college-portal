export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

interface RouteParams {
  params: { id: string };
}

// POST: 신규 목표 대학 등록
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "VIEWER") {
      return NextResponse.json(
        { error: "Forbidden: Viewer cannot add target universities" },
        { status: 403 }
      );
    }

    const { id: studentId } = params;
    const body = await request.json();
    const {
      universityName,
      location,
      major,
      proposerType,
      applicationType,
      admissionTier,
      pros,
      cons,
      counselorNotes,
      resultStatus,
    } = body;

    if (!universityName) {
      return NextResponse.json({ error: "University name is required" }, { status: 400 });
    }

    const university = await prisma.targetUniversity.create({
      data: {
        studentId,
        universityName,
        location: location || null,
        major: major || null,
        proposerType: proposerType || "TEACHER_RECOMMENDED",
        applicationType: applicationType || "REGULAR",
        admissionTier: admissionTier || "MATCH",
        pros: pros || null,
        cons: cons || null,
        counselorNotes: counselorNotes || null,
        resultStatus: resultStatus || "CONSIDERING",
      },
    });

    return NextResponse.json({ success: true, university });
  } catch (error) {
    console.error("Create target university error:", error);
    return NextResponse.json(
      { error: "Failed to create target university" },
      { status: 500 }
    );
  }
}

// DELETE: 목표 대학 삭제
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("universityId");

    if (!universityId) {
      return NextResponse.json({ error: "University ID is required" }, { status: 400 });
    }

    await prisma.targetUniversity.delete({
      where: { id: universityId },
    });

    return NextResponse.json({ success: true, message: "목표 대학이 삭제되었습니다." });
  } catch (error) {
    console.error("Delete target university error:", error);
    return NextResponse.json(
      { error: "Failed to delete target university" },
      { status: 500 }
    );
  }
}
