# 등대교육공동체 진학상담포탈 재사용 스킬 및 유틸리티 명세 (Skills.md)

이 문서는 등대글로벌스쿨 진학상담포탈의 핵심 비즈니스 로직을 수행하는 Antigravity 에이전트 전용 재사용 스킬(Core Skills)과 알고리즘 명세서입니다.

---

## Skill 1: `parseGradelinkTranscriptPDF`

### 1.1 개요 및 목적
Gradelink 성적표 PDF를 Gemini 2.5 Flash API에 전달하여 2단 레이아웃 및 텍스트 왜곡에 영향받지 않고 정형화된 JSON 데이터로 100% 신뢰성 있게 추출하는 스킬.

### 1.2 Gemini Document 프롬프트 (System Prompt)
```text
You are an expert transcript parser specialized in high school academic records from Gradelink (CEEB: 682019, Lighthouse International School).
Your mission is to extract the student's personal information and comprehensive course-by-course academic history from the provided transcript PDF document.

CRITICAL PARSING RULES:
1. Student Information:
   - Extract 'Student ID' (typically 4 digits, e.g., 1017, 1121). If not labeled, inspect the top header or filename.
   - Extract 'Name' (split into English name and Korean name if present, e.g., "LIM, Gaeun" or "SEUNGJOO 백승주 BACK").
   - Extract 'Birth Date', 'Entry Date', 'Graduation Date', 'Withdrawal Date' in YYYY-MM-DD format if available.
2. Semester & Course History:
   - The document has a multi-column (2-column) layout. Ensure courses are strictly grouped under their respective Academic Year and Semester headers (e.g., "2022-2023 Semester 1", "Summer Semester 2024").
   - Grade Level: Deduce the student's grade level for that semester (Grade 9, 10, 11, or 12).
   - For each course, extract:
     * courseTitle: The exact class title (e.g., "AP Calculus AB", "Algebra II (Credit Recovery)", "Honors English I"). Preserve tags like "(APEX)" or "(UC Scout)".
     * credits: Number of credits attempted/earned (e.g., 0.5, 1.0). If missing or non-credit, mark 0.0.
     * letterGrade: Original letter grade (e.g., "A+", "A", "A-", "B+", "B", "C", "P", "F", "nm").
     * percentage: Numeric percentage if available (e.g., 94.5).
3. Edge Cases:
   - If a course has grade "nm" (No Mark) or "N/A" (transferred/withdrawn), keep the letterGrade as "nm".
   - Extract the reported 'Term GPA' and 'Cumulative GPA' printed on the PDF for verification purposes.
```

### 1.3 JSON Response Schema (Structured Outputs)
```json
{
  "type": "object",
  "properties": {
    "student": {
      "type": "object",
      "properties": {
        "studentCode": { "type": "string" },
        "nameEn": { "type": "string" },
        "nameKo": { "type": "string", "nullable": true },
        "birthDate": { "type": "string", "nullable": true },
        "entryDate": { "type": "string", "nullable": true },
        "graduationDate": { "type": "string", "nullable": true },
        "withdrawalDate": { "type": "string", "nullable": true },
        "gender": { "type": "string", "nullable": true }
      },
      "required": ["studentCode", "nameEn"]
    },
    "semesters": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "academicYear": { "type": "string" },
          "termName": { "type": "string" },
          "gradeLevel": { "type": "integer" },
          "reportedTermGpa": { "type": "number", "nullable": true },
          "reportedCumGpa": { "type": "number", "nullable": true },
          "courses": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "courseCode": { "type": "string", "nullable": true },
                "courseTitle": { "type": "string" },
                "credits": { "type": "number" },
                "letterGrade": { "type": "string" },
                "percentage": { "type": "number", "nullable": true }
              },
              "required": ["courseTitle", "credits", "letterGrade"]
            }
          }
        },
        "required": ["academicYear", "termName", "gradeLevel", "courses"]
      }
    }
  },
  "required": ["student", "semesters"]
}
```

---

## Skill 2: `classifySubjectCategory`

### 2.1 개요 및 목적
추출된 과목명(`courseTitle`)을 분석하여 5대 핵심 교과(`ENGLISH`, `MATH`, `SCIENCE`, `SOCIAL_STUDIES`, `FOREIGN_LANGUAGE`)와 기타 교과(`OTHER`)로 정밀 매핑하는 규칙 엔진.

### 2.2 분류 규칙 및 매핑 사전

```typescript
export type SubjectCategory = 
  | 'ENGLISH' 
  | 'MATH' 
  | 'SCIENCE' 
  | 'SOCIAL_STUDIES' 
  | 'FOREIGN_LANGUAGE' 
  | 'OTHER';

interface CategoryRule {
  category: SubjectCategory;
  patterns: RegExp[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'ENGLISH',
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
    category: 'MATH',
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
    category: 'SCIENCE',
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
    category: 'SOCIAL_STUDIES',
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
    category: 'FOREIGN_LANGUAGE',
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
 * 과목명을 5대 핵심교과 및 OTHER로 자동 분류
 * @param courseTitle 과목명 문자열
 * @returns SubjectCategory
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

  // 기본값은 기타(OTHER: Bible, PE, Art, Music, Seminar, CS 등)
  return 'OTHER';
}
```

---

## Skill 3: `recalculateStudentGPAs`

### 3.1 개요 및 목적
학생의 전체 학기 및 과목 데이터를 순회하며 Credit Make-up 반영 여부를 확인하고, 학기별 Term GPA, 5대 교과 Term Core GPA, 전체 누적 Cumulative Unweighted GPA, 5대 교과 Core Cumulative GPA를 산출하는 단일 계산 알고리즘.

### 3.2 4.0 만점 Unweighted 환산 함수
```typescript
export function convertGradeToPoint(letterGrade: string): { gradePoint: number; includeInGpa: boolean } {
  const grade = letterGrade.trim().toUpperCase();

  switch (grade) {
    case 'A+':
    case 'A':
      return { gradePoint: 4.0, includeInGpa: true };
    case 'A-':
      return { gradePoint: 3.7, includeInGpa: true };
    case 'B+':
      return { gradePoint: 3.3, includeInGpa: true };
    case 'B':
      return { gradePoint: 3.0, includeInGpa: true };
    case 'B-':
      return { gradePoint: 2.7, includeInGpa: true };
    case 'C+':
      return { gradePoint: 2.3, includeInGpa: true };
    case 'C':
      return { gradePoint: 2.0, includeInGpa: true };
    case 'C-':
      return { gradePoint: 1.7, includeInGpa: true };
    case 'D+':
      return { gradePoint: 1.3, includeInGpa: true };
    case 'D':
      return { gradePoint: 1.0, includeInGpa: true };
    case 'D-':
      return { gradePoint: 0.7, includeInGpa: true };
    case 'F':
      return { gradePoint: 0.0, includeInGpa: true };
    
    // GPA 계산에서 제외되는 패스/논마크 과목
    case 'P':
    case 'PASS':
    case 'NM':
    case 'N/A':
    case 'W':
    case 'AUDIT':
    default:
      return { gradePoint: 0.0, includeInGpa: false };
  }
}
```

### 3.3 재계산 알고리즘 상세 명세
```typescript
export interface CourseInput {
  id: string;
  category: SubjectCategory;
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

const CORE_CATEGORIES: SubjectCategory[] = [
  'ENGLISH',
  'MATH',
  'SCIENCE',
  'SOCIAL_STUDIES',
  'FOREIGN_LANGUAGE',
];

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

      // Credit Make-up 적용 시 수정된 점수 우선 사용
      let effectivePoint = course.unweightedGradePoint;
      if (course.isCreditMakeup && course.adjustedGradePoint !== null && course.adjustedGradePoint !== undefined) {
        effectivePoint = course.adjustedGradePoint;
      }

      const credit = course.credits;
      if (credit <= 0) continue;

      // 전체 학기 합산
      semGradePoints += effectivePoint * credit;
      semCredits += credit;

      // 5대 핵심 교과 여부 확인
      if (CORE_CATEGORIES.includes(course.category)) {
        semCoreGradePoints += effectivePoint * credit;
        semCoreCredits += credit;
      }
    }

    // 누적 합산 반영
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
```
