import { PrismaClient } from "@prisma/client";
import { evaluateAndApplyPromotion } from "../src/lib/academic/promotion";

const prisma = new PrismaClient();

async function main() {
  console.log("🏫 Running US Curriculum Spring Semester (Semester 2) Auto-Promotion on all students...");

  const students = await prisma.student.findMany({
    orderBy: { studentCode: "asc" },
  });

  console.log(`Processing ${students.length} students...`);

  let promotedCount = 0;
  let graduatedCount = 0;
  let enrolledCount = 0;
  let withdrawalCount = 0;

  for (const s of students) {
    const res = await evaluateAndApplyPromotion(s.id);
    if (!res) continue;

    if (res.promoted) {
      promotedCount++;
      console.log(`[PROMOTED] ${s.studentCode} ${s.nameEn}: Gr.${res.previousGradeLevel} (${res.previousStatus}) ➔ Gr.${res.newGradeLevel} (${res.newStatus}) | ${res.reason}`);
    }

    if (res.newStatus === "GRADUATED") graduatedCount++;
    else if (res.newStatus === "WITHDRAWAL") withdrawalCount++;
    else enrolledCount++;
  }

  console.log("\n📊 Final Status Summary:");
  console.log(`- Total Students: ${students.length}`);
  console.log(`- Enrolled Students: ${enrolledCount}`);
  console.log(`- Graduated Students: ${graduatedCount}`);
  console.log(`- Withdrawal Students: ${withdrawalCount}`);
  console.log(`- Total Auto-Promoted in this run: ${promotedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
