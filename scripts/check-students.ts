import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    include: {
      _count: { select: { semesterRecords: true } }
    }
  });
  console.log('Students count:', students.length);
  for (const s of students) {
    console.log({
      studentCode: s.studentCode,
      nameEn: s.nameEn,
      gradeLevel: s.gradeLevel,
      status: s.status,
      cumulativeGpa: s.cumulativeGpa,
      coreCumulativeGpa: s.coreCumulativeGpa,
      cumulativeCredits: s.cumulativeCredits,
      semestersCount: s._count.semesterRecords
    });
  }
}
main().finally(() => prisma.$disconnect());
