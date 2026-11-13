import path from 'path';
import { execFileSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { classifySubjectCategory } from '../src/lib/gpa/classifier';
import { convertGradeToPoint, recalculateStudentGPAs } from '../src/lib/gpa/calculator';

const prisma = new PrismaClient();

async function main() {
  const scriptPath = path.resolve(process.cwd(), 'scripts/parse_transcript.py');
  const file = 'Transcript/Semester 1 2025-2026/12 - Semester 1 2025-2026/1017 - LIM, Gaeun.pdf';
  const out = execFileSync('python', [scriptPath, file], { encoding: 'utf-8' });
  const data = JSON.parse(out);

  const { student: parsedStudent, semesters: parsedSemesters } = data;

  console.log('parsedStudent:', parsedStudent);

  try {
    const student = await prisma.student.upsert({
      where: { studentCode: parsedStudent.studentCode },
      update: {
        nameEn: parsedStudent.nameEn,
        nameKo: parsedStudent.nameKo || undefined,
        gradeLevel: parsedStudent.gradeLevel,
        status: parsedStudent.status,
      },
      create: {
        studentCode: parsedStudent.studentCode,
        nameEn: parsedStudent.nameEn,
        gradeLevel: parsedStudent.gradeLevel,
        status: parsedStudent.status,
      }
    });

    console.log('Student upserted:', student.id);

    for (const sem of parsedSemesters) {
      const s = await prisma.semesterRecord.upsert({
        where: {
          studentId_academicYear_termName: {
            studentId: student.id,
            academicYear: sem.academicYear,
            termName: sem.termName,
          }
        },
        update: {
          gradeLevel: sem.gradeLevel,
          reportedTermGpa: sem.reportedTermGpa,
        },
        create: {
          studentId: student.id,
          academicYear: sem.academicYear,
          termName: sem.termName,
          gradeLevel: sem.gradeLevel,
          reportedTermGpa: sem.reportedTermGpa,
        }
      });

      console.log('Semester upserted:', sem.academicYear, sem.termName, 'id:', s.id);
    }
  } catch (err) {
    console.error('Error during upsert:', err);
  }
}

main().finally(() => prisma.$disconnect());
