import { SubjectCategory } from "./classifier";

/**
 * Converts letter grade to unweighted 4.0 grade point
 */
export function convertGradeToPoint(letterGrade: string): { gradePoint: number; includeInGpa: boolean } {
  const grade = letterGrade.trim().toUpperCase();

  switch (grade) {
    case "A+":
    case "A":
      return { gradePoint: 4.0, includeInGpa: true };
    case "A-":
      return { gradePoint: 3.7, includeInGpa: true };
    case "B+":
      return { gradePoint: 3.3, includeInGpa: true };
    case "B":
      return { gradePoint: 3.0, includeInGpa: true };
    case "B-":
      return { gradePoint: 2.7, includeInGpa: true };
    case "C+":
      return { gradePoint: 2.3, includeInGpa: true };
    case "C":
      return { gradePoint: 2.0, includeInGpa: true };
    case "C-":
      return { gradePoint: 1.7, includeInGpa: true };
    case "D+":
      return { gradePoint: 1.3, includeInGpa: true };
    case "D":
      return { gradePoint: 1.0, includeInGpa: true };
    case "D-":
      return { gradePoint: 0.7, includeInGpa: true };
    case "F":
      return { gradePoint: 0.0, includeInGpa: true };

    // Non-GPA grades (P/F, nm, N/A, W)
    case "P":
    case "PASS":
    case "NM":
    case "N/A":
    case "W":
    case "AUDIT":
    default:
      return { gradePoint: 0.0, includeInGpa: false };
  }
}

export interface CourseInput {
  id?: string;
  category: SubjectCategory | string;
  credits: number;
  originalGrade: string;
  unweightedGradePoint: number;
  isCreditMakeup: boolean;
  adjustedGrade?: string | null;
  adjustedGradePoint?: number | null;
  includeInGpa: boolean;
}

export interface SemesterInput {
  id: string;
  academicYear: string;
  termName: string;
  courses: CourseInput[];
}

export interface RecalculationResult {
  cumulativeGpa: number;       // 전체 누적 Unweighted GPA (소수점 3자리)
  coreCumulativeGpa: number;   // 5대 교과 누적 Unweighted GPA (소수점 3자리)
  cumulativeCredits: number;   // 총 취득 학점
  updatedSemesters: {
    id: string;
    termGpa: number;           // 해당 학기 전체 GPA
    termCoreGpa: number;       // 해당 학기 5대 교과 GPA
    termCredits: number;       // 해당 학기 취득 학점
  }[];
}

const CORE_CATEGORIES: string[] = [
  "ENGLISH",
  "MATH",
  "SCIENCE",
  "SOCIAL_STUDIES",
  "FOREIGN_LANGUAGE",
];

/**
 * Calculates term GPAs, cumulative Unweighted GPA, and Core Cumulative GPA
 */
export function recalculateStudentGPAs(semesters: SemesterInput[]): RecalculationResult {
  let totalGradePoints = 0;
  let totalCredits = 0;

  let totalCoreGradePoints = 0;
  let totalCoreCredits = 0;

  const updatedSemesters = semesters.map((sem) => {
    let semGradePoints = 0;
    let semCredits = 0;
    let semCoreGradePoints = 0;
    let semCoreCredits = 0;

    for (const course of sem.courses) {
      if (!course.includeInGpa) continue;

      // Credit Make-up applies adjusted grade if present
      let effectivePoint = course.unweightedGradePoint;
      if (course.isCreditMakeup && course.adjustedGradePoint !== null && course.adjustedGradePoint !== undefined) {
        effectivePoint = course.adjustedGradePoint;
      }

      const credit = course.credits;
      if (credit <= 0) continue;

      // All Courses Accumulation
      semGradePoints += effectivePoint * credit;
      semCredits += credit;

      // 5 Core Subjects Accumulation
      if (CORE_CATEGORIES.includes(course.category)) {
        semCoreGradePoints += effectivePoint * credit;
        semCoreCredits += credit;
      }
    }

    totalGradePoints += semGradePoints;
    totalCredits += semCredits;
    totalCoreGradePoints += semCoreGradePoints;
    totalCoreCredits += semCoreCredits;

    const termGpa = semCredits > 0 ? Number((semGradePoints / semCredits).toFixed(3)) : 0.0;
    const termCoreGpa = semCoreCredits > 0 ? Number((semCoreGradePoints / semCoreCredits).toFixed(3)) : 0.0;

    return {
      id: sem.id,
      termGpa,
      termCoreGpa,
      termCredits: Number(semCredits.toFixed(3)),
    };
  });

  const cumulativeGpa = totalCredits > 0 ? Number((totalGradePoints / totalCredits).toFixed(3)) : 0.0;
  const coreCumulativeGpa = totalCoreCredits > 0 ? Number((totalCoreGradePoints / totalCoreCredits).toFixed(3)) : 0.0;

  return {
    cumulativeGpa,
    coreCumulativeGpa,
    cumulativeCredits: Number(totalCredits.toFixed(3)),
    updatedSemesters,
  };
}
