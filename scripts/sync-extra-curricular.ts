import { PrismaClient } from "@prisma/client";
import * as xlsx from "xlsx";
import * as path from "path";
import * as fs from "fs";

const prisma = new PrismaClient();

function cleanName(s: string): string {
  if (!s) return "";
  return s.replace("Student Name(", "").replace(")", "").trim();
}

function tokenize(s: string): Set<string> {
  if (!s) return new Set();
  let normalized = s
    .replace(/SE RIN/gi, "SERIN")
    .replace(/SEOYONG/gi, "SEOYOUNG");

  // match words in English and Korean
  const matches = normalized.toLowerCase().match(/[a-z]+|[가-힣]+/g) || [];
  const noise = new Set([
    "student",
    "name",
    "grade",
    "ella",
    "maeve",
    "daniel",
    "joseph",
    "grace",
    "ethan",
    "ruben",
    "sophia",
    "diana",
    "rachel",
  ]);
  return new Set(matches.filter((w) => !noise.has(w)));
}

async function main() {
  console.log("🚀 Starting Extra-Curricular Data Sync from extra-curri.xlsx...");

  const filePath = path.resolve(process.cwd(), "Extra/extra-curri.xlsx");
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook = xlsx.readFile(filePath);
  const students = await prisma.student.findMany({
    select: {
      id: true,
      studentCode: true,
      nameEn: true,
      nameKo: true,
      gradeLevel: true,
    },
  });

  const parsedStudents = students.map((s) => ({
    ...s,
    enTokens: tokenize(s.nameEn),
    koTokens: s.nameKo ? new Set([s.nameKo.trim()]) : new Set<string>(),
  }));

  console.log(`📋 Found ${students.length} students in Database.`);

  let totalParsed = 0;
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<any>(ws, { header: 1 });
    if (!rows || rows.length < 2) continue;

    const parts = sheetName.split("-");
    const semNormalized =
      parts.length === 2
        ? `${parts[0]}-${parts[1].charAt(0).toUpperCase()}${parts[1].slice(1).toLowerCase()}`
        : sheetName;

    console.log(`\n📂 Processing Sheet: ${sheetName} -> Normalized Term: ${semNormalized}`);

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1] || !String(row[1]).trim()) continue;

      totalParsed++;
      const grade = row[0] ? String(row[0]).trim() : null;
      const rawName = String(row[1]).trim();
      const cleaned = cleanName(rawName);
      const tokens = tokenize(cleaned);
      const koFound = cleaned.match(/[가-힣]{2,4}/g) || [];

      // Match student
      let matchedStudent: (typeof parsedStudents)[0] | null = null;

      // 1. Korean name exact match
      for (const k of koFound) {
        const candidates = parsedStudents.filter((p) => p.koTokens.has(k));
        if (candidates.length === 1) {
          matchedStudent = candidates[0];
          break;
        }
      }

      // 2. English token match
      if (!matchedStudent) {
        let bestCandidate: (typeof parsedStudents)[0] | null = null;
        let maxOverlap = 0;

        for (const p of parsedStudents) {
          if (!p.enTokens || p.enTokens.size === 0) continue;
          let overlap = 0;
          for (const t of tokens) {
            if (p.enTokens.has(t)) overlap++;
          }
          if (overlap >= 2 && overlap > maxOverlap) {
            maxOverlap = overlap;
            bestCandidate = p;
          }
        }
        if (bestCandidate) {
          matchedStudent = bestCandidate;
        }
      }

      if (!matchedStudent) {
        console.warn(`  ⚠️ Could not match student for: "${rawName}" in sheet ${sheetName}`);
        continue;
      }

      // Curricular Activity
      const caClub = row[2] && String(row[2]).trim() !== "-" ? String(row[2]).trim() : null;
      const caMusic = row[3] && String(row[3]).trim() !== "-" ? String(row[3]).trim() : null;

      let curricularType: string | null = null;
      let curricularActivity: string | null = null;

      if (caMusic && caClub) {
        curricularType = "Music / PA & Club";
        curricularActivity = `${caMusic} / ${caClub}`;
      } else if (caMusic) {
        curricularType = "Music / PA";
        curricularActivity = caMusic;
      } else if (caClub) {
        curricularType = "Club Activity";
        curricularActivity = caClub;
      }

      const awards = row[4] && String(row[4]).trim() !== "-" ? String(row[4]).trim() : null;
      const volunteerWork = row[5] && String(row[5]).trim() !== "-" ? String(row[5]).trim() : null;
      const studentActivities = row[6] && String(row[6]).trim() !== "-" ? String(row[6]).trim() : null;

      const clubNameFallback = studentActivities || curricularActivity || "비교과 활동";

      // Check if duplicate entry already exists for this student & semester
      const existing = await prisma.clubActivity.findFirst({
        where: {
          studentId: matchedStudent.id,
          semester: semNormalized,
          curricularActivity,
          studentActivities,
        },
      });

      if (existing) {
        // Update existing record if needed
        await prisma.clubActivity.update({
          where: { id: existing.id },
          data: {
            gradeLevel: grade || existing.gradeLevel,
            curricularType,
            curricularActivity,
            awards,
            volunteerWork,
            studentActivities,
            clubName: clubNameFallback,
            yearsActive: grade || existing.yearsActive,
            description: volunteerWork || existing.description,
          },
        });
        totalSkipped++;
      } else {
        await prisma.clubActivity.create({
          data: {
            studentId: matchedStudent.id,
            semester: semNormalized,
            gradeLevel: grade,
            curricularType,
            curricularActivity,
            awards,
            volunteerWork,
            studentActivities,
            clubName: clubNameFallback,
            role: "Member",
            yearsActive: grade || "9, 10",
            description: volunteerWork,
          },
        });
        totalInserted++;
      }
    }
  }

  console.log("\n==========================================");
  console.log(`✅ Extra-Curricular Sync Finished Successfully!`);
  console.log(`   - Total Rows Processed : ${totalParsed}`);
  console.log(`   - New Records Created  : ${totalInserted}`);
  console.log(`   - Updated / Skipped    : ${totalSkipped}`);
  console.log("==========================================");
}

main()
  .catch((e) => {
    console.error("❌ Sync Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
