import mammoth from "mammoth";

export interface ParsedDocxActivity {
  filename: string;
  rawName: string;
  studentName: string;
  grade: string;
  curricularType: "Club Activity" | "Music / PA" | "Music / PA & Club" | null;
  curricularActivity: string | null;
  awards: string | null;
  volunteerWork: string | null;
  studentActivities: string | null;
}

export interface StudentMatchCandidate {
  id: string;
  studentCode: string;
  nameEn: string;
  nameKo: string | null;
  gradeLevel: number;
  enTokens?: Set<string>;
  koTokens?: Set<string>;
}

export function cleanStudentNameFromFilename(filename: string): string {
  let name = filename.replace(/\.docx$/i, "").trim();
  // Strip duplicate suffix like (1), _1, (2)
  name = name.replace(/(?:_\d+|\s*\(\d+\))$/g, "").trim();
  // Strip Student Name(...) wrapper
  const match = name.match(/^Student\s*Name\s*\((.+)\)$/i);
  if (match) {
    name = match[1].trim();
  }
  return name;
}

export function tokenizeName(s: string): Set<string> {
  if (!s) return new Set();
  const normalized = s
    .replace(/SE RIN/gi, "SERIN")
    .replace(/SEOYONG/gi, "SEOYOUNG");

  const matches = normalized.toLowerCase().match(/[a-z]+|[가-힣]+/g) || [];
  const noise = new Set([
    "student",
    "name",
    "grade",
    "ella",
    "maeve",
    "daniel",
    "joseph",
    "grace",
    "ethan",
    "ruben",
    "sophia",
    "diana",
    "rachel",
  ]);
  return new Set(matches.filter((w) => !noise.has(w)));
}

export function matchStudentToRoster(
  rawName: string,
  students: StudentMatchCandidate[]
): StudentMatchCandidate | null {
  const cleaned = cleanStudentNameFromFilename(rawName);
  const tokens = tokenizeName(cleaned);
  const koFound = cleaned.match(/[가-힣]{2,4}/g) || [];

  // 1. Korean exact match
  for (const k of koFound) {
    const candidates = students.filter(
      (s) => s.nameKo && s.nameKo.trim() === k
    );
    if (candidates.length === 1) {
      return candidates[0];
    }
  }

  // 2. English token overlap match
  let bestCandidate: StudentMatchCandidate | null = null;
  let maxOverlap = 0;

  for (const s of students) {
    const sTokens = s.enTokens || tokenizeName(s.nameEn);
    if (!sTokens || sTokens.size === 0) continue;

    let overlap = 0;
    tokens.forEach((t) => {
      if (sTokens.has(t)) overlap++;
    });

    if (overlap >= 2 && overlap > maxOverlap) {
      maxOverlap = overlap;
      bestCandidate = s;
    }
  }

  return bestCandidate;
}

export function extractTablesFromHtml(html: string): string[][][] {
  const tables: string[][][] = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tMatch: RegExpExecArray | null;

  while ((tMatch = tableRegex.exec(html)) !== null) {
    const tableContent = tMatch[1];
    const rows: string[][] = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rMatch: RegExpExecArray | null;

    while ((rMatch = rowRegex.exec(tableContent)) !== null) {
      const rowContent = rMatch[1];
      const cells: string[] = [];
      const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      let cMatch: RegExpExecArray | null;

      while ((cMatch = cellRegex.exec(rowContent)) !== null) {
        const cellText = cMatch[1]
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/gi, " ")
          .replace(/&amp;/gi, "&")
          .replace(/&lt;/gi, "<")
          .replace(/&gt;/gi, ">")
          .replace(/\s+/g, " ")
          .trim();
        cells.push(cellText);
      }
      if (cells.length > 0) rows.push(cells);
    }
    if (rows.length > 0) tables.push(rows);
  }
  return tables;
}

export async function parseSingleDocxBuffer(
  buffer: Buffer,
  filename: string,
  targetGrade: string
): Promise<ParsedDocxActivity> {
  const studentName = cleanStudentNameFromFilename(filename);
  let html = "";

  try {
    const result = await mammoth.convertToHtml({ buffer });
    html = result.value;
  } catch (err) {
    console.warn(`Mammoth failed on ${filename}:`, err);
    throw new Error(`Failed to read Word file: ${filename}`);
  }

  const tables = extractTablesFromHtml(html);

  let clubActivity = "";
  let musicPA = "";
  const awardsList: string[] = [];
  const volunteerList: string[] = [];
  const studentActivitiesList: string[] = [];

  for (let tIdx = 0; tIdx < tables.length; tIdx++) {
    const table = tables[tIdx];
    if (!table || table.length === 0) continue;

    const firstRowJoined = table[0].join(" ").toLowerCase();
    const allTableJoined = table.map((r) => r.join(" ")).join(" ").toLowerCase();

    // Stop if we hit Student Learning Outcomes (SLO) or Homeroom Teacher Comment
    if (
      firstRowJoined.includes("lifelong learner") ||
      firstRowJoined.includes("integrity") ||
      firstRowJoined.includes("comment") ||
      allTableJoined.includes("homeroom teacher")
    ) {
      break;
    }

    // 1. Curricular Activities (Club Activity / Music & PA)
    if (
      allTableJoined.includes("club activity") ||
      allTableJoined.includes("music / pa") ||
      allTableJoined.includes("music/pa")
    ) {
      table.forEach((row) => {
        const label = (row[0] || "").toLowerCase();
        const contentVal = (row[2] !== undefined ? row[2] : row[1] || "").trim();
        if (contentVal && contentVal !== "-") {
          if (label.includes("club activity")) {
            clubActivity = contentVal;
          } else if (label.includes("music") || label.includes("pa")) {
            musicPA = contentVal;
          }
        }
      });
      continue;
    }

    // 2. Student Activities (Club Name | Hours | Content)
    if (firstRowJoined.includes("club name")) {
      for (let r = 1; r < table.length; r++) {
        const clubName = (table[r][0] || "").trim();
        if (
          clubName &&
          clubName.toLowerCase() !== "club name" &&
          clubName !== "-"
        ) {
          studentActivitiesList.push(clubName);
        }
      }
      continue;
    }

    // 3. Awards or Volunteer Work (Date | Content)
    if (firstRowJoined.includes("date") && firstRowJoined.includes("content")) {
      const extractedContents: string[] = [];
      for (let r = 1; r < table.length; r++) {
        const contentCell = (table[r][1] !== undefined ? table[r][1] : "").trim();
        if (contentCell && contentCell !== "-") {
          extractedContents.push(contentCell);
        }
      }
      // Template standard: First Date-Content table is Awards, next is Volunteer Work
      if (tIdx === 1 || (awardsList.length === 0 && tIdx < 2)) {
        awardsList.push(...extractedContents);
      } else {
        volunteerList.push(...extractedContents);
      }
    }
  }

  let curricularType: ParsedDocxActivity["curricularType"] = null;
  let curricularActivity: string | null = null;

  if (musicPA && clubActivity) {
    curricularType = "Music / PA & Club";
    curricularActivity = `${musicPA} / ${clubActivity}`;
  } else if (musicPA) {
    curricularType = "Music / PA";
    curricularActivity = musicPA;
  } else if (clubActivity) {
    curricularType = "Club Activity";
    curricularActivity = clubActivity;
  }

  return {
    filename,
    rawName: filename.replace(/\.docx$/i, "").trim(),
    studentName,
    grade: targetGrade || "Grade 9",
    curricularType,
    curricularActivity,
    awards: awardsList.length > 0 ? awardsList.join("\n") : null,
    volunteerWork: volunteerList.length > 0 ? volunteerList.join("\n") : null,
    studentActivities:
      studentActivitiesList.length > 0 ? studentActivitiesList.join(", ") : null,
  };
}
