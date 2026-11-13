import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const transcriptDir = path.resolve(process.cwd(), "Transcript");
const scriptPath = path.resolve(process.cwd(), "scripts/parse_transcript.py");

function find1017Files(dir: string): string[] {
  let res: string[] = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      res = res.concat(find1017Files(full));
    } else if (item.includes("1017")) {
      res.push(full);
    }
  }
  return res;
}

const files = find1017Files(transcriptDir);
console.log(`Found ${files.length} files for 1017:`);
for (const f of files) {
  const out = execFileSync("python", [scriptPath, f], { encoding: "utf-8" });
  const data = JSON.parse(out);
  console.log({
    file: f.replace(process.cwd(), ""),
    name: data.student.nameEn,
    semestersCount: data.semesters.length,
    reportedCumGpa: data.student.reportedCumGpa,
    reportedCredits: data.student.reportedCredits,
  });
}
