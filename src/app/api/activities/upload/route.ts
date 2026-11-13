export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  parseSingleDocxBuffer,
  matchStudentToRoster,
  tokenizeName,
  StudentMatchCandidate,
} from "@/lib/docx/docxParser";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "COUNSELOR") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin and Counselor can upload activities" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const semester = (formData.get("semester") as string) || "2026-Spring";
    const gradeLevel = (formData.get("gradeLevel") as string) || "Grade 9";
    const overwrite = formData.get("overwrite") === "true";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded. Please select at least one .docx file." },
        { status: 400 }
      );
    }

    // Fetch all students from DB
    const dbStudents = await prisma.student.findMany({
      select: {
        id: true,
        studentCode: true,
        nameEn: true,
        nameKo: true,
        gradeLevel: true,
      },
    });

    const parsedCandidates: StudentMatchCandidate[] = dbStudents.map((s) => ({
      ...s,
      enTokens: tokenizeName(s.nameEn),
      koTokens: s.nameKo ? new Set([s.nameKo.trim()]) : new Set<string>(),
    }));

    const results = [];
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let unmatchedCount = 0;

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".docx")) {
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const parsed = await parseSingleDocxBuffer(buffer, file.name, gradeLevel);
        const matched = matchStudentToRoster(parsed.rawName, parsedCandidates);

        if (!matched) {
          unmatchedCount++;
          results.push({
            filename: file.name,
            rawName: parsed.rawName,
            status: "UNMATCHED",
            matchedStudent: null,
            data: parsed,
          });
          continue;
        }

        const clubNameFallback =
          parsed.studentActivities || parsed.curricularActivity || "비교과 활동";

        // Check if an existing record exists for this student and semester
        const existing = await prisma.clubActivity.findFirst({
          where: {
            studentId: matched.id,
            semester,
          },
        });

        if (existing) {
          if (overwrite) {
            await prisma.clubActivity.update({
              where: { id: existing.id },
              data: {
                gradeLevel,
                curricularType: parsed.curricularType,
                curricularActivity: parsed.curricularActivity,
                awards: parsed.awards,
                volunteerWork: parsed.volunteerWork,
                studentActivities: parsed.studentActivities,
                clubName: clubNameFallback,
                yearsActive: gradeLevel,
                description: parsed.volunteerWork,
              },
            });
            updatedCount++;
            results.push({
              filename: file.name,
              rawName: parsed.rawName,
              status: "UPDATED",
              matchedStudent: {
                id: matched.id,
                studentCode: matched.studentCode,
                nameEn: matched.nameEn,
                nameKo: matched.nameKo,
              },
              data: parsed,
            });
          } else {
            skippedCount++;
            results.push({
              filename: file.name,
              rawName: parsed.rawName,
              status: "SKIPPED",
              matchedStudent: {
                id: matched.id,
                studentCode: matched.studentCode,
                nameEn: matched.nameEn,
                nameKo: matched.nameKo,
              },
              data: parsed,
            });
          }
        } else {
          await prisma.clubActivity.create({
            data: {
              studentId: matched.id,
              semester,
              gradeLevel,
              curricularType: parsed.curricularType,
              curricularActivity: parsed.curricularActivity,
              awards: parsed.awards,
              volunteerWork: parsed.volunteerWork,
              studentActivities: parsed.studentActivities,
              clubName: clubNameFallback,
              role: "Member",
              yearsActive: gradeLevel,
              description: parsed.volunteerWork,
            },
          });
          insertedCount++;
          results.push({
            filename: file.name,
            rawName: parsed.rawName,
            status: "INSERTED",
            matchedStudent: {
              id: matched.id,
              studentCode: matched.studentCode,
              nameEn: matched.nameEn,
              nameKo: matched.nameKo,
            },
            data: parsed,
          });
        }
      } catch (fileErr: any) {
        console.error(`Error processing file ${file.name}:`, fileErr);
        results.push({
          filename: file.name,
          rawName: file.name,
          status: "ERROR",
          error: fileErr.message || "Failed to parse Word file",
          matchedStudent: null,
          data: null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalFiles: files.length,
      matchedCount: insertedCount + updatedCount + skippedCount,
      insertedCount,
      updatedCount,
      skippedCount,
      unmatchedCount,
      semester,
      gradeLevel,
      results,
    });
  } catch (error: any) {
    console.error("Activities Word upload error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during upload" },
      { status: 500 }
    );
  }
}
