/**
 * US Academic Calendar & Academic Year Utility
 * 
 * In the US curriculum (LIS Curriculum):
 * - Fall Semester (1st Semester): Starts in August (Month 8) through December/January.
 *   Belongs to Academic Year: [CurrentYear]-[CurrentYear + 1]
 * - Spring Semester (2nd Semester): Starts in January/February through June/July (Month 7).
 *   Belongs to Academic Year: [CurrentYear - 1]-[CurrentYear]
 * 
 * Example:
 * - November 2026 -> 2026-2027 Academic Year (1st Semester)
 * - March 2027    -> 2026-2027 Academic Year (2nd Semester)
 * - August 2027   -> 2027-2028 Academic Year (1st Semester)
 */

export interface AcademicYearInfo {
  academicYear: string;       // e.g., "2026-2027"
  semester: string;           // e.g., "1st Semester" or "2nd Semester"
  semesterFull: string;       // e.g., "1st Semester (Fall)" or "2nd Semester (Spring)"
  startYear: number;          // 2026
  endYear: number;            // 2027
  isFirstSemester: boolean;   // true for Fall, false for Spring
}

/**
 * Calculates current US Academic Year and Semester based on reference date (defaults to current system/Google time).
 */
export function getCurrentAcademicYearInfo(date: Date = new Date()): AcademicYearInfo {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1; // 1-indexed: 1 = Jan, ..., 12 = Dec

  // Month 8 (August) to Month 12 (December) is Fall (1st Semester)
  // Month 1 (January) to Month 7 (July) is Spring (2nd Semester)
  const isFirstSemester = currentMonth >= 8;

  const startYear = isFirstSemester ? currentYear : currentYear - 1;
  const endYear = startYear + 1;

  const academicYear = `${startYear}-${endYear}`;
  const semester = isFirstSemester ? "1st Semester" : "2nd Semester";
  const semesterFull = isFirstSemester ? "1st Semester (Fall)" : "2nd Semester (Spring)";

  return {
    academicYear,
    semester,
    semesterFull,
    startYear,
    endYear,
    isFirstSemester,
  };
}
