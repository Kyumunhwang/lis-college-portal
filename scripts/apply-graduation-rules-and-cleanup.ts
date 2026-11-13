import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎓 Applying Graduation Rules and Cleaning Up Fake Students...");

  // 1. Delete fake student 1018 Grace Lee (0 semesters)
  const fake1018 = await prisma.student.findUnique({ where: { studentCode: "1018" } });
  if (fake1018) {
    console.log("Removing fake student 1018 (Grace Lee)...");
    await prisma.standardizedTest.deleteMany({ where: { studentId: fake1018.id } });
    await prisma.clubActivity.deleteMany({ where: { studentId: fake1018.id } });
    await prisma.awardRecord.deleteMany({ where: { studentId: fake1018.id } });
    await prisma.counselingLog.deleteMany({ where: { studentId: fake1018.id } });
    await prisma.targetUniversity.deleteMany({ where: { studentId: fake1018.id } });
    await prisma.student.delete({ where: { id: fake1018.id } });
    console.log("✅ Fake student 1018 removed.");
  }

  // 2. Clean dummy relational seed data from 1017 & 1121 if present
  const student1017 = await prisma.student.findUnique({ where: { studentCode: "1017" } });
  if (student1017) {
    console.log("Cleaning dummy counseling and tests from student 1017...");
    await prisma.counselingLog.deleteMany({ where: { studentId: student1017.id } });
    await prisma.targetUniversity.deleteMany({ where: { studentId: student1017.id } });
    await prisma.standardizedTest.deleteMany({ where: { studentId: student1017.id } });
    await prisma.clubActivity.deleteMany({ where: { studentId: student1017.id } });
    await prisma.awardRecord.deleteMany({ where: { studentId: student1017.id } });
    // Reset nameKo if it was "김등대" (seed dummy)
    if (student1017.nameKo === "김등대") {
      await prisma.student.update({
        where: { id: student1017.id },
        data: { nameKo: "임가은" },
      });
    }
  }

  // 3. Fetch all remaining students with their semester records
  const students = await prisma.student.findMany({
    include: {
      semesterRecords: {
        orderBy: [{ academicYear: "asc" }, { termName: "asc" }],
      },
    },
  });

  console.log(`Processing graduation status for ${students.length} students...`);

  let graduatedCount = 0;
  let enrolledCount = 0;
  let withdrawalCount = 0;
  const gradYearCounts: Record<number, number> = {};

  for (const s of students) {
    if (s.semesterRecords.length === 0) continue;

    // Check if official withdrawal date exists
    const isWithdrawal = !!s.withdrawalDate || s.status === "WITHDRAWAL";

    // Determine graduation year based on the formula:
    // For each regular semester (Semester 1 or Semester 2):
    // springYear = parseInt(academicYear.split("-")[1])
    // gradYear = springYear + (12 - gradeLevel)
    const candidateGradYears: number[] = [];

    for (const sem of s.semesterRecords) {
      const parts = sem.academicYear.match(/(\d{4})-(\d{4})/);
      if (parts && sem.gradeLevel >= 9 && sem.gradeLevel <= 12) {
        const springYear = parseInt(parts[2], 10);
        const calcGradYear = springYear + (12 - sem.gradeLevel);
        candidateGradYears.push(calcGradYear);
      }
    }

    // Use mode/median or the latest semester's calcGradYear
    let finalGradYear = candidateGradYears.length > 0 
      ? candidateGradYears[candidateGradYears.length - 1] 
      : 2026;

    // If withdrawal
    if (isWithdrawal) {
      withdrawalCount++;
      await prisma.student.update({
        where: { id: s.id },
        data: {
          status: "WITHDRAWAL",
          graduationYear: finalGradYear,
        },
      });
      continue;
    }

    // If finalGradYear <= 2026 -> GRADUATED
    if (finalGradYear <= 2026) {
      graduatedCount++;
      gradYearCounts[finalGradYear] = (gradYearCounts[finalGradYear] || 0) + 1;

      await prisma.student.update({
        where: { id: s.id },
        data: {
          status: "GRADUATED",
          graduationYear: finalGradYear,
          gradeLevel: 12,
          graduationDate: new Date(`${finalGradYear}-06-10`),
        },
      });
    } else {
      // Still ENROLLED (Class of 2027, 2028, 2029...)
      enrolledCount++;
      // Current grade for 2026-2027 school year:
      // gradYear 2027 -> 12
      // gradYear 2028 -> 11
      // gradYear 2029 -> 10
      // gradYear 2030 -> 9
      const currentGrade = Math.max(9, Math.min(12, 12 - (finalGradYear - 2027)));

      await prisma.student.update({
        where: { id: s.id },
        data: {
          status: "ENROLLED",
          graduationYear: finalGradYear,
          gradeLevel: currentGrade,
        },
      });
    }
  }

  console.log("\n📊 Graduation Classification Summary:");
  console.log(`- Total Students: ${students.length}`);
  console.log(`- Enrolled Students: ${enrolledCount}`);
  console.log(`- Graduated Students: ${graduatedCount}`);
  console.log(`- Withdrawal Students: ${withdrawalCount}`);
  console.log("- Graduated breakdown by year:", gradYearCounts);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
