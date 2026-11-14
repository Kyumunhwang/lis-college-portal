/**
 * US Academic Semester Utilities (LIS College Counseling Portal)
 * 
 * Provides dynamic generation of past and future academic semesters,
 * default semester calculation, and validation for custom semesters.
 */

export interface SemesterOption {
  value: string;
  label: string;
  year: number;
  season: "Spring" | "Fall";
}

export const CUSTOM_SEMESTER_VALUE = "__CUSTOM__";

/**
 * Generates dynamic semester options from startYear up to (currentYear + futureYears).
 * Default covers 2023 ~ (currentYear + 4), sorted descending (latest/future first).
 */
export function getDynamicSemesterOptions(startYear = 2023, futureYears = 4): SemesterOption[] {
  const currentYear = new Date().getFullYear();
  const maxYear = Math.max(currentYear + futureYears, 2030);
  const options: SemesterOption[] = [];

  for (let y = maxYear; y >= startYear; y--) {
    options.push({
      value: `${y}-Fall`,
      label: `${y}-Fall (${y} 가을학기)`,
      year: y,
      season: "Fall",
    });
    options.push({
      value: `${y}-Spring`,
      label: `${y}-Spring (${y} 봄학기)`,
      year: y,
      season: "Spring",
    });
  }

  return options;
}

/**
 * Calculates current default semester based on calendar month.
 * Month 8 (Aug) ~ Month 12 (Dec) -> [CurrentYear]-Fall
 * Month 1 (Jan) ~ Month 7 (Jul)  -> [CurrentYear]-Spring
 */
export function getDefaultCurrentSemester(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const season = month >= 8 ? "Fall" : "Spring";
  return `${year}-${season}`;
}
