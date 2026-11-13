# Supabase (PostgreSQL) 원클릭 마이그레이션 가이드 (MIGRATION_SUPABASE.md)

등대교육공동체 진학상담포탈은 설계 단계부터 **SQLite $\rightarrow$ Supabase PostgreSQL 100% 무중단 호환성**을 보장하도록 구축되었습니다. 본 문서는 로컬 개발 환경(`file:./dev.db`)에서 프로덕션 Supabase 클라우드로 이관할 때의 실행 절차를 설명합니다.

---

## 1. 사전 준비 (Prerequisites)

1. [Supabase](https://supabase.com)에 로그인 후 새 프로젝트(`lis-counseling-portal`) 생성.
2. **Project Settings $\rightarrow$ Database**에서 `Connection string (URI)` 복사:
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
   ```

---

## 2. 마이그레이션 3단계 절차

### 1단계: 환경변수 설정 (`.env`)
`.env` 파일의 `DATABASE_URL`을 복사한 Supabase 접속 문자열로 교체합니다:
```env
# Production Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

JWT_SECRET="your-production-secure-random-secret"
GEMINI_API_KEY="your-google-gemini-api-key"
PORT=3005
```

### 2단계: Prisma Provider 전환 (`prisma/schema.prisma`)
`prisma/schema.prisma`의 2행 `provider`를 `postgresql`로 변경합니다:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 3단계: 스키마 푸시 및 초기 시드 주입
터미널에서 다음 두 명령어를 실행합니다:
```bash
# 1. Supabase PostgreSQL에 테이블 생성
npx prisma db push

# 2. 관리자(Admin), 상담교사(Counselor), 샘플 학생 시드 주입
npx prisma db seed
```

---

## 3. 마이그레이션 검증 체크리스트

- [ ] Supabase Table Editor에서 `users`, `students`, `semester_records`, `course_grades` 테이블 생성 확인.
- [ ] Admin 계정(`kyumun.hwang@gmail.com` / `emeo1004#`)으로 로그인 성공 확인.
- [ ] Counselor 계정(`ls.counselors@gmail.com` / `1234`) 로그인 시 강제 비밀번호 변경 플로우 정상 작동 확인.
- [ ] Gradelink PDF 일괄 업로드 및 4.0 만점 Unweighted GPA 계산 정상 검증.
