# 🚀 [A안: Vercel + Supabase] 무중단 웹호스팅 가이드

등대글로벌스쿨 진학상담포털(LIS College Portal)을 **Vercel(웹 프론트/API)**과 **Supabase(PostgreSQL 보안 데이터베이스)**로 배포하는 원클릭 가이드입니다.

로컬에 저장된 **127명 학생, 전체 성적표, 182건 비교과 활동 데이터**가 손실 없이 100% 클라우드로 자동 이관됩니다.

---

## 📌 전체 배포 3단계 요약

```
[1단계: Supabase 무료 프로젝트 생성] ➔ [2단계: 원클릭 데이터 이관 실행] ➔ [3단계: Vercel에 GitHub 연동 및 배포]
```

---

## 1단계: Supabase 무료 프로젝트 생성 (3분)

1. [Supabase 공식 홈페이지 (supabase.com)](https://supabase.com)에 로그인 (GitHub 계정으로 1초 로그인 가능)
2. **"New Project"** 클릭:
   - **Name**: `lis-college-portal`
   - **Database Password**: 안전한 비밀번호 입력 (예: `Lighthouse2026!#` - 메모 필수)
   - **Region**: `Northeast Asia (Seoul)` 또는 `Tokyo` 선택
3. 프로젝트 생성 완료 후 좌측 메뉴 **Project Settings** ➔ **Database** 로 이동:
   - **Connection string** 섹션에서 **URI** 탭 선택
   - **Transaction Pooler (포트 6543)** 문자열 복사 (`DATABASE_URL`용)
     ```text
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require
     ```
   - **Session / Direct (포트 5432)** 문자열 복사 (`DIRECT_URL`용)
     ```text
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
     ```

---

## 2단계: 로컬 데이터 ➔ Supabase 원클릭 이관 (1분)

로컬의 `.env` 파일에 복사한 Supabase 접속 문자열을 입력합니다:

```env
# .env 파일에 추가
SUPABASE_DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

터미널에서 아래 자동 마이그레이션 명령어를 1회 실행합니다:

```bash
npm run db:migrate:supabase
```

> **자동 실행 내용:**
> 1. Supabase PostgreSQL에 테이블 구조(10개 테이블) 자동 생성
> 2. 로컬 SQLite(`dev.db`)의 사용자, 127명 학생, 성적표, 182건 비교과 활동 일괄 업로드

---

## 3단계: Vercel 웹 호스팅 배포 (2분)

1. [Vercel 공식 홈페이지 (vercel.com)](https://vercel.com)에 로그인 (GitHub 계정으로 연동)
2. **"Add New..."** ➔ **"Project"** 클릭 후 `Kyumunhwang/lis-college-portal` 저장소 선택 (**Import**)
3. **Environment Variables (환경 변수)** 섹션에 아래 4개 값 추가:
   - `DATABASE_URL` : Supabase Transaction Pooler URI (포트 6543)
   - `DIRECT_URL` : Supabase Direct URI (포트 5432)
   - `JWT_SECRET` : `lis-counseling-portal-super-secret-key-2024` (또는 영문난수)
   - `PORT` : `3000` (기본값)
4. 배포 전 스키마를 프로덕션용으로 전환하여 푸시:
   ```bash
   npm run db:use:supabase
   git add prisma/schema.prisma
   git commit -m "chore: switch prisma schema to Supabase PostgreSQL for Vercel production"
   git push origin main
   ```
5. Vercel에서 **"Deploy"** 버튼 클릭!
   - 1~2분 후 `https://lis-college-portal.vercel.app` 과 같은 무료 글로벌 도메인(SSL 자동적용)이 즉시 발급되며 전 세계 어디서나 접속 가능해집니다.

---

## 🔒 운영 및 유지보수 팁
- **로컬에서 다시 개발할 때:** `npm run db:use:sqlite` 실행 시 로컬 SQLite 모드로 즉각 복귀 가능
- **프로덕션 배포할 때:** `npm run db:use:supabase` 실행 후 커밋 & 푸시
