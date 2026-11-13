import fs from 'fs';
// @ts-ignore
import pdf from 'pdf-parse';

async function test() {
  const filePath = 'Transcript/Semester 1 2023-2024/12 - Semester 1 2023-2024/1037 - KANG, JIIN.pdf';
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  console.log('Pages:', data.numpages);
  console.log('Text preview:\n', data.text.slice(0, 1500));
}

test().catch(console.error);
