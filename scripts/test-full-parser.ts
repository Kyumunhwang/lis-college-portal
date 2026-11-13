import fs from 'fs';
// @ts-ignore
import pdf from 'pdf-parse';

export interface ParsedStudentInfo {
  studentCode: string;
  nameEn: string;
  nameKo?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  entryDate?: string | null;
  graduationDate?: string | null;
  withdrawalDate?: string | null;
  parentName?: string | null;
  address?: string | null;
  gradeLevel: number;
  reportedCumGpa?: number | null;
  reportedCredits?: number | null;
}

export interface ParsedCourse {
  courseTitle: string;
  credits: number;
  letterGrade: string;
}

export interface ParsedSemester {
  academicYear: string;
  termName: string;
  gradeLevel: number;
  reportedTermGpa?: number | null;
  courses: ParsedCourse[];
}

export function parseGradelinkText(text: string, filename: string): { student: ParsedStudentInfo; semesters: ParsedSemester[] } {
  const filenameMatch = filename.match(/^(\d{4})\s*-\s*([^.]+)\.pdf$/i);
  const studentCode = filenameMatch ? filenameMatch[1].trim() : '0000';

  // 1. Name parsing: e.g. "Name: JIIN 강지인  KANG" or "Name: Serin KIM"
  let nameEn = filenameMatch ? filenameMatch[2].trim() : 'Unknown';
  let nameKo: string | null = null;
  const nameMatch = text.match(/Name:\s*([^\n\r]+?)\s*Birth Date:/i);
  if (nameMatch) {
    const rawName = nameMatch[1].trim();
    // Check for Korean characters
    const koMatch = rawName.match(/[\uAC00-\uD7AF]+/g);
    if (koMatch) {
      nameKo = koMatch.join(' ');
      // Clean Korean from nameEn
      nameEn = rawName.replace(/[\uAC00-\uD7AF]+/g, '').replace(/\s+/g, ' ').trim();
    } else {
      nameEn = rawName;
    }
  }

  // 2. Birth Date (MM/DD/YYYY -> YYYY-MM-DD)
  let birthDate: string | null = null;
  const birthMatch = text.match(/Birth Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (birthMatch) {
    birthDate = `${birthMatch[3]}-${birthMatch[1]}-${birthMatch[2]}`;
  }

  // 3. Gender
  let gender: string | null = null;
  const genderMatch = text.match(/Gender:\s*(Female|Male|F|M)/i);
  if (genderMatch) {
    gender = genderMatch[1].toUpperCase().startsWith('F') ? 'F' : 'M';
  }

  // 4. Parent/Guardian
  let parentName: string | null = null;
  const parentMatch = text.match(/Parent\/Guardian:\s*([^\n\r]+?)(?=\s*Address:|\s*City:|$)/i);
  if (parentMatch) {
    parentName = parentMatch[1].trim();
  }

  // 5. Entry Date, Withdrawal Date, Graduation Date
  let entryDate: string | null = null;
  const entryMatch = text.match(/Entry Date:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (entryMatch) {
    const parts = entryMatch[1].split('/');
    entryDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
  }

  let withdrawalDate: string | null = null;
  const withMatch = text.match(/Withdrawal Date:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (withMatch) {
    const parts = withMatch[1].split('/');
    withdrawalDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
  }

  let graduationDate: string | null = null;
  const gradMatch = text.match(/Graduation Date:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (gradMatch) {
    const parts = gradMatch[1].split('/');
    graduationDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
  }

  // 6. Cumulative GPA & Credits
  let reportedCumGpa: number | null = null;
  let reportedCredits: number | null = null;
  const cumMatch = text.match(/Un-Weighted Cumulative GPA:\s*([\d.]+)\s*Cumulative Credits:\s*([\d.]+)/i);
  if (cumMatch) {
    reportedCumGpa = parseFloat(cumMatch[1]);
    reportedCredits = parseFloat(cumMatch[2]);
  }

  // 7. Grade Levels and Term GPAs from bottom summary table
  // e.g. "Grade Level: 9   GPA: 4.00   Credits: 3.500"
  const summaryRegex = /Grade Level:\s*(\d+)\s+GPA:\s*([\d.]+)\s+Credits:\s*([\d.]+)/gi;
  const termSummaries: { gradeLevel: number; gpa: number; credits: number }[] = [];
  let sMatch;
  while ((sMatch = summaryRegex.exec(text)) !== null) {
    termSummaries.push({
      gradeLevel: parseInt(sMatch[1], 10),
      gpa: parseFloat(sMatch[2]),
      credits: parseFloat(sMatch[3]),
    });
  }

  // Determine current student grade level (highest or last term grade)
  const currentGradeLevel = termSummaries.length > 0 
    ? termSummaries[termSummaries.length - 1].gradeLevel 
    : 11;

  // 8. Parse Semester Blocks
  // Pattern: "Semester 1 2020-2021" or "Summer Semester 2025"
  const semesterRegex = /(Semester\s+[12]\s+\d{4}-\d{4}|(?:Summer|Winter)\s+Semester\s+\d{4})/gi;
  const semesterSplits: { termHeader: string; index: number }[] = [];
  let semMatch;
  while ((semMatch = semesterRegex.exec(text)) !== null) {
    semesterSplits.push({ termHeader: semMatch[0], index: semMatch.index });
  }

  const semesters: ParsedSemester[] = [];

  for (let i = 0; i < semesterSplits.length; i++) {
    const current = semesterSplits[i];
    const nextIndex = i + 1 < semesterSplits.length ? semesterSplits[i + 1].index : text.indexOf('Un-Weighted Cumulative GPA');
    const blockText = text.substring(current.index, nextIndex !== -1 ? nextIndex : undefined);

    // Parse header: e.g. "Semester 1 2020-2021" -> termName: "Semester 1", academicYear: "2020-2021"
    // or "Summer Semester 2025" -> termName: "Summer Semester", academicYear: "2024-2025"
    let termName = "Semester 1";
    let academicYear = "2023-2024";

    const s1 = current.termHeader.match(/^(Semester\s+[12])\s+(\d{4}-\d{4})$/i);
    if (s1) {
      termName = s1[1];
      academicYear = s1[2];
    } else {
      const s2 = current.termHeader.match(/^(Summer|Winter)\s+Semester\s+(\d{4})$/i);
      if (s2) {
        termName = `${s2[1]} Semester`;
        const year = parseInt(s2[2], 10);
        academicYear = `${year - 1}-${year}`;
      }
    }

    // Associated grade level from summary
    const summary = i < termSummaries.length ? termSummaries[i] : null;
    const gradeLevel = summary ? summary.gradeLevel : currentGradeLevel;
    const reportedTermGpa = summary ? summary.gpa : null;

    // Parse courses inside block
    // Lines between "Class Title Grade Credits" and next header/end
    const courses: ParsedCourse[] = [];
    const lines = blockText.split(/\r?\n/);
    let classSectionStarted = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.includes('Class Title') && trimmed.includes('Credits')) {
        classSectionStarted = true;
        continue;
      }
      if (!classSectionStarted) continue;
      if (trimmed.startsWith('Semester ') || trimmed.startsWith('Un-Weighted')) break;

      // Course line format: "{Title...} {Grade} {Credits}"
      // e.g. "Honors English I A+ 0.500"
      // e.g. "AP Microeconomics (APEX) A+ 0.500"
      // e.g. "Creative Writing Pass 0.500"
      // e.g. "Geometry B 0.500"
      const courseMatch = trimmed.match(/^(.+?)\s+([A-D][+-]?|F|P|Pass|NM|N\/A|W)\s+([\d.]+)\s*$/i);
      if (courseMatch) {
        const title = courseMatch[1].trim();
        const grade = courseMatch[2].trim();
        const credits = parseFloat(courseMatch[3]);
        courses.push({
          courseTitle: title,
          letterGrade: grade,
          credits,
        });
      }
    }

    semesters.push({
      academicYear,
      termName,
      gradeLevel,
      reportedTermGpa,
      courses,
    });
  }

  return {
    student: {
      studentCode,
      nameEn,
      nameKo,
      birthDate,
      gender,
      entryDate,
      graduationDate,
      withdrawalDate,
      parentName,
      gradeLevel: currentGradeLevel,
      reportedCumGpa,
      reportedCredits,
    },
    semesters,
  };
}

async function run() {
  const file1 = 'Transcript/Semester 1 2023-2024/12 - Semester 1 2023-2024/1037 - KANG, JIIN.pdf';
  const buf1 = fs.readFileSync(file1);
  const pdf1 = await pdf(buf1);
  const res1 = parseGradelinkText(pdf1.text, '1037 - KANG, JIIN.pdf');
  console.log('1037 Parsed:', JSON.stringify({
    student: res1.student,
    semestersCount: res1.semesters.length,
    firstSem: res1.semesters[0],
    lastSem: res1.semesters[res1.semesters.length - 1],
  }, null, 2));

  const file2 = 'Transcript/Semester 1 2023-2024/9 - Semester 1 2023-2024/1014 - KIM, Serin.pdf';
  const buf2 = fs.readFileSync(file2);
  const pdf2 = await pdf(buf2);
  const res2 = parseGradelinkText(pdf2.text, '1014 - KIM, Serin.pdf');
  console.log('1014 Parsed:', JSON.stringify({
    student: res2.student,
    semestersCount: res2.semesters.length,
    firstSem: res2.semesters[0],
    lastSem: res2.semesters[res2.semesters.length - 1],
  }, null, 2));
}

run().catch(console.error);
