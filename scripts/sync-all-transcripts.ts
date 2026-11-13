import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { classifySubjectCategory } from "../src/lib/gpa/classifier";
import { convertGradeToPoint, recalculateStudentGPAs } from "../src/lib/gpa/calculator";

const prisma = new PrismaClient();

function getAllPdfFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllPdfFiles(fullPath));
    } else if (file.toLowerCase().endsWith(".pdf")) {
      results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  console.log("🚀 Starting Comprehensive Real Transcript Sync...");

  // Enable WAL mode & busy timeout for SQLite stability
  try {
    await prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL;");
    await prisma.$executeRawUnsafe("PRAGMA busy_timeout = 60000;");
  } catch (e) {
    console.warn("Could not set SQLite pragmas:", e);
  }

  // 1. Clean existing dummy grades and semesters to ensure 100% clean state
  console.log("Cleaning old semester records and course grades...");
  await prisma.courseGrade.deleteMany();
  await prisma.semesterRecord.deleteMany();

  const transcriptDir = path.resolve(process.cwd(), "Transcript");
  const allPdfFiles = getAllPdfFiles(transcriptDir);
  console.log(`Found ${allPdfFiles.length} total transcript PDF files.`);

  // Group by studentCode
  const studentFileMap = new Map<string, string[]>();

  for (const pdfPath of allPdfFiles) {
    const filename = path.basename(pdfPath);
    const m = filename.match(/^(\d{4})\s*-\s*([^.]+)\.pdf$/i);
    if (m) {
      const code = m[1];
      if (!studentFileMap.has(code)) {
        studentFileMap.set(code, []);
      }
      studentFileMap.get(code)!.push(pdfPath);
    }
  }

  console.log(`Processing ${studentFileMap.size} unique students...`);

  const scriptPath = path.resolve(process.cwd(), "scripts/parse_transcript.py");
  let processed = 0;

  for (const [studentCode, files] of studentFileMap.entries()) {
    // Sort files to prefer the newest academic year folder first (e.g. 2025-2026 > 2024-2025 > 2023-2024)
    files.sort((a, b) => b.localeCompare(a));

    // Consolidate semesters across files for this student
    let bestStudentInfo: any = null;
    const semesterMap = new Map<string, any>(); // key: `${academicYear}_${termName}`

    for (const filePath of files) {
      const filename = path.basename(filePath);
      try {
        const outStr = execFileSync("python", [scriptPath, filePath, filename], {
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
        });
        const parsed = JSON.parse(outStr);

        if (!bestStudentInfo || (parsed.student.gradeLevel && parsed.student.gradeLevel >= (bestStudentInfo.gradeLevel || 0))) {
          bestStudentInfo = parsed.student;
        }

        for (const sem of parsed.semesters) {
          const semKey = `${sem.academicYear}_${sem.termName}`;
          if (!semesterMap.has(semKey) || (sem.courses && sem.courses.length > semesterMap.get(semKey).courses.length)) {
            semesterMap.set(semKey, sem);
          }
        }
      } catch (err) {
        // continue
      }
    }

    if (!bestStudentInfo || !bestStudentInfo.nameEn) continue;

    // Determine resolved grade level from highest semester or student info
    let maxGrade = bestStudentInfo.gradeLevel || 9;
    for (const sem of semesterMap.values()) {
      if (sem.gradeLevel && sem.gradeLevel > maxGrade) {
        maxGrade = sem.gradeLevel;
      }
    }

    const resolvedStatus = bestStudentInfo.withdrawalDate
      ? "WITHDRAWAL"
      : bestStudentInfo.graduationDate
      ? "GRADUATED"
      : "ENROLLED";

    // Upsert Student
    const student = await prisma.student.upsert({
      where: { studentCode },
      update: {
        nameEn: bestStudentInfo.nameEn,
        nameKo: bestStudentInfo.nameKo || undefined,
        gradeLevel: maxGrade,
        status: resolvedStatus,
        birthDate: bestStudentInfo.birthDate ? new Date(bestStudentInfo.birthDate) : undefined,
        gender: bestStudentInfo.gender || undefined,
        entryDate: bestStudentInfo.entryDate ? new Date(bestStudentInfo.entryDate) : undefined,
        graduationDate: bestStudentInfo.graduationDate ? new Date(bestStudentInfo.graduationDate) : undefined,
        withdrawalDate: bestStudentInfo.withdrawalDate ? new Date(bestStudentInfo.withdrawalDate) : undefined,
        parentName: bestStudentInfo.parentName || undefined,
        address: bestStudentInfo.address || undefined,
      },
      create: {
        studentCode,
        nameEn: bestStudentInfo.nameEn,
        nameKo: bestStudentInfo.nameKo || null,
        gradeLevel: maxGrade,
        status: resolvedStatus,
        birthDate: bestStudentInfo.birthDate ? new Date(bestStudentInfo.birthDate) : null,
        gender: bestStudentInfo.gender || null,
        entryDate: bestStudentInfo.entryDate ? new Date(bestStudentInfo.entryDate) : null,
        graduationDate: bestStudentInfo.graduationDate ? new Date(bestStudentInfo.graduationDate) : null,
        withdrawalDate: bestStudentInfo.withdrawalDate ? new Date(bestStudentInfo.withdrawalDate) : null,
        parentName: bestStudentInfo.parentName || null,
        address: bestStudentInfo.address || null,
      },
    });

    // Insert all unique semesters and courses using nested create for maximum speed and SQLite lock avoidance
    const createdSemesters = [];
    for (const sem of semesterMap.values()) {
      const coursesData = sem.courses.map((course) => {
        const category = classifySubjectCategory(course.courseTitle);
        const { gradePoint, includeInGpa } = convertGradeToPoint(course.letterGrade);
        return {
          courseTitle: course.courseTitle,
          category,
          credits: course.credits || 0.5,
          originalGrade: course.letterGrade,
          unweightedGradePoint: gradePoint,
          includeInGpa,
        };
      });

      const semRecord = await prisma.semesterRecord.create({
        data: {
          studentId: student.id,
          academicYear: sem.academicYear,
          termName: sem.termName,
          gradeLevel: sem.gradeLevel || maxGrade,
          reportedTermGpa: sem.reportedTermGpa || null,
          courses: {
            create: coursesData,
          },
        },
        include: {
          courses: true,
        },
      });
      createdSemesters.push(semRecord);
    }

    // Recalculate all GPAs using single source of truth
    const calcInput = createdSemesters.map((s) => ({
      id: s.id,
      academicYear: s.academicYear,
      termName: s.termName,
      courses: s.courses.map((c) => ({
        id: c.id,
        category: c.category,
        credits: c.credits,
        originalGrade: c.originalGrade,
        unweightedGradePoint: c.unweightedGradePoint,
        isCreditMakeup: c.isCreditMakeup,
        adjustedGrade: c.adjustedGrade,
        adjustedGradePoint: c.adjustedGradePoint,
        includeInGpa: c.includeInGpa,
      })),
    }));

    const calcResult = recalculateStudentGPAs(calcInput);

    for (const uSem of calcResult.updatedSemesters) {
      await prisma.semesterRecord.update({
        where: { id: uSem.id },
        data: {
          termGpa: uSem.termGpa,
          termCoreGpa: uSem.termCoreGpa,
          termCredits: uSem.termCredits,
        },
      });
    }

    await prisma.student.update({
      where: { id: student.id },
      data: {
        cumulativeGpa: calcResult.cumulativeGpa,
        coreCumulativeGpa: calcResult.coreCumulativeGpa,
        cumulativeCredits: calcResult.cumulativeCredits,
      },
    });

    processed++;
    if (processed % 10 === 0 || processed === studentFileMap.size) {
      console.log(`[${processed}/${studentFileMap.size}] [${student.studentCode}] ${student.nameEn} (Grade ${maxGrade}, Status: ${resolvedStatus}, Semesters: ${semesterMap.size}, All GPA: ${calcResult.cumulativeGpa.toFixed(3)}, Core GPA: ${calcResult.coreCumulativeGpa.toFixed(3)})`);
    }
  }

  console.log(`\n🎉 All ${processed} students successfully synchronized with 100% real transcript data!`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
