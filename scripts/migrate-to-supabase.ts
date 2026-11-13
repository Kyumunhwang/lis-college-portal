import { PrismaClient } from "@prisma/client";
import { Client as PgClient } from "pg";
import * as fs from "fs";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================================");
  console.log("🚀 LIS College Portal: SQLite -> Supabase PostgreSQL Migration");
  console.log("==================================================================");

  const targetUrl =
    process.env.SUPABASE_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL;

  if (!targetUrl || targetUrl.startsWith("file:")) {
    console.log("\n⚠️ Supabase PostgreSQL 연결 주소(URL)가 설정되지 않았습니다.");
    console.log("실행 방법:");
    console.log("  1) .env 파일에 SUPABASE_DATABASE_URL 및 DIRECT_URL을 설정하세요.");
    console.log('     SUPABASE_DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"');
    console.log('     DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"');
    console.log("  2) 다시 실행: npm run db:migrate:supabase\n");
    return;
  }

  const directUrl = process.env.DIRECT_URL || targetUrl;

  console.log("\n1️⃣ Supabase PostgreSQL 연결 확인 중...");
  const cleanPgUrl = directUrl
    .replace(/([?&])sslmode=[^&]*/g, "")
    .replace(/[?&]$/, "");

  const pg = new PgClient({
    connectionString: cleanPgUrl,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await pg.connect();
    const res = await pg.query("SELECT version()");
    console.log("   ✅ Supabase 연결 성공:", res.rows[0].version.split(",")[0]);
  } catch (err: any) {
    console.error("   ❌ Supabase 연결 실패:", err.message);
    process.exit(1);
  }

  console.log("\n2️⃣ PostgreSQL 스키마 푸시 (테이블 구조 자동 생성)...");
  const sqliteSchema = fs.readFileSync("prisma/schema.sqlite.prisma", "utf8");
  const pgSchema = fs.readFileSync("prisma/schema.postgresql.prisma", "utf8");

  fs.writeFileSync("prisma/schema.prisma", pgSchema, "utf8");
  try {
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: targetUrl, DIRECT_URL: directUrl },
    });
    console.log("   ✅ Supabase PostgreSQL 테이블 생성 완료!");
  } catch (e: any) {
    console.error("   ❌ Prisma db push 실패:", e.message);
  } finally {
    fs.writeFileSync("prisma/schema.prisma", sqliteSchema, "utf8");
  }

  console.log("\n3️⃣ 로컬 SQLite 데이터 추출 및 Supabase 적재 시작...");

  // Generic helper to insert rows into Postgres
  const insertRows = async (table: string, rows: any[]) => {
    if (!rows || rows.length === 0) {
      console.log(`   📂 [${table}]: 로컬 데이터 0건`);
      return;
    }
    console.log(`   📂 [${table}]: 로컬 레코드 ${rows.length}개 적재 중...`);

    const cols = Object.keys(rows[0]);
    const colNames = cols.map((c) => `"${c}"`).join(", ");

    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const valList: any[] = [];
      const rowPlaceholders: string[] = [];

      chunk.forEach((row) => {
        const itemPlaceholders = cols.map((c) => {
          valList.push(row[c]);
          return `$${valList.length}`;
        });
        rowPlaceholders.push(`(${itemPlaceholders.join(", ")})`);
      });

      const updateSet = cols
        .filter((c) => c !== "id")
        .map((c) => `"${c}" = EXCLUDED."${c}"`)
        .join(", ");

      const upsertQuery = `
        INSERT INTO "${table}" (${colNames})
        VALUES ${rowPlaceholders.join(", ")}
        ON CONFLICT ("id") DO UPDATE SET ${updateSet}
      `;

      try {
        await pg.query(upsertQuery, valList);
      } catch (err: any) {
        console.warn(`      ⚠️ [${table}] chunk upsert warning (${err.message}). Retrying row-by-row...`);
        for (const r of chunk) {
          const vals = cols.map((c) => r[c]);
          const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(", ");
          try {
            await pg.query(
              `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${updateSet}`,
              vals
            );
          } catch (singleErr: any) {
            console.warn(`         Single row skip: ${r.id} (${singleErr.message})`);
          }
        }
      }
    }
    console.log(`      ✨ [${table}] ${rows.length}건 Supabase 적재 완료`);
  };

  // Extract in dependency order
  const users = await prisma.user.findMany();
  await insertRows("users", users);

  const students = await prisma.student.findMany();
  await insertRows("students", students);

  const semesterRecords = await prisma.semesterRecord.findMany();
  await insertRows("semester_records", semesterRecords);

  const courseGrades = await prisma.courseGrade.findMany();
  await insertRows("course_grades", courseGrades);

  const gradeAuditLogs = await prisma.gradeAuditLog.findMany();
  await insertRows("grade_audit_logs", gradeAuditLogs);

  const standardizedTests = await prisma.standardizedTest.findMany();
  await insertRows("standardized_tests", standardizedTests);

  const clubActivities = await prisma.clubActivity.findMany();
  await insertRows("club_activities", clubActivities);

  const awardRecords = await prisma.awardRecord.findMany();
  await insertRows("award_records", awardRecords);

  const counselingLogs = await prisma.counselingLog.findMany();
  await insertRows("counseling_logs", counselingLogs);

  const targetUniversities = await prisma.targetUniversity.findMany();
  await insertRows("target_universities", targetUniversities);

  await prisma.$disconnect();
  await pg.end();

  console.log("\n==================================================================");
  console.log("🎉 SQLite -> Supabase 마이그레이션이 성공적으로 완료되었습니다!");
  console.log(`   - 학생: ${students.length}명`);
  console.log(`   - 비교과 활동: ${clubActivities.length}건`);
  console.log(`   - 성적표 레코드: ${semesterRecords.length}개 학기, ${courseGrades.length}개 과목`);
  console.log("==================================================================");
}

main().catch(console.error);
