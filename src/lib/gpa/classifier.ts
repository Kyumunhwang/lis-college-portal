export type SubjectCategory =
  | "ENGLISH"
  | "MATH"
  | "SCIENCE"
  | "SOCIAL_STUDIES"
  | "FOREIGN_LANGUAGE"
  | "OTHER";

interface CategoryRule {
  category: SubjectCategory;
  patterns: RegExp[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "ENGLISH",
    patterns: [
      /\bEnglish\b/i,
      /\bGreat Books\b/i,
      /\bCreative Writing\b/i,
      /\bReading Skills\b/i,
      /\bLiterature\b/i,
      /\bComposition\b/i,
      /\bAP English\b/i,
    ],
  },
  {
    category: "MATH",
    patterns: [
      /\bAlgebra\b/i,
      /\bGeometry\b/i,
      /\bPrecalculus\b/i,
      /\bCalculus\b/i,
      /\bStatistics\b/i,
      /\bProbability\b/i,
      /\bPersonal Finance\b/i,
      /\bMath\b/i,
    ],
  },
  {
    category: "SCIENCE",
    patterns: [
      /\bBiology\b/i,
      /\bChemistry\b/i,
      /\bPhysics\b/i,
      /\bEnvironmental Science\b/i,
      /\bEarth Science\b/i,
      /\bAnatomy\b/i,
      /\bPhysiology\b/i,
      /\bAP Bio\b/i,
      /\bAP Chem\b/i,
      /\bAP Physics\b/i,
    ],
  },
  {
    category: "SOCIAL_STUDIES",
    patterns: [
      /\bHistory\b/i,
      /\bWorld History\b/i,
      /\bUS History\b/i,
      /\bKorean History\b/i,
      /\bPsychology\b/i,
      /\bSociology\b/i,
      /\bEconomics\b/i,
      /\bGovernment\b/i,
      /\bCivics\b/i,
      /\bGeography\b/i,
      /\bAP Psychology\b/i,
      /\bAP US History\b/i,
    ],
  },
  {
    category: "FOREIGN_LANGUAGE",
    patterns: [
      /\bChinese\b/i,
      /\bSpanish\b/i,
      /\bJapanese\b/i,
      /\bFrench\b/i,
      /\bLatin\b/i,
    ],
  },
];

/**
 * Classifies a course title into one of the 5 Core Subjects or OTHER
 */
export function classifySubjectCategory(courseTitle: string): SubjectCategory {
  const cleanTitle = courseTitle.trim();

  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(cleanTitle)) {
        return rule.category;
      }
    }
  }

  return "OTHER";
}
