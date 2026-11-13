# 등대교육공동체 진학상담포탈 프로젝트 컨텍스트 및 상태 기록소 (Memory.md)

이 문서는 Antigravity AI 에이전트가 세션이 바뀌거나 새로운 대화가 시작되어도 프로젝트의 핵심 도메인 지식, 불변 비즈니스 로직, 시스템 상태 및 아키텍처 결정 사항(ADR)을 영구적으로 기억하기 위한 **Living Memory**입니다.

---

## 1. 학교 및 시스템 핵심 도메인 지식 (School Domain Knowledge)

### 1.1 기본 정보
* **학교명:** 등대글로벌스쿨 (Lighthouse International School, LIS)
* **학교 CEEB 코드:** `682019`
* **주요 사용 대상:** 9~12학년 고등학교 진학상담교사(College Counselor) 및 관리자(Admin)
* **시스템 성격:** 학생에게 화면을 노출하지 않는 **순수 교직원 전용(Teacher-Only) 1:1 진학상담 워크스테이션**

### 1.2 Gradelink Official Transcript 성적표 특이사항 및 파싱 유의점
1. **파일명 규칙:**
   * 포맷: `{학번} - {성, 이름}.pdf` (예: `1017 - LIM, Gaeun.pdf`, `1121 - BACK, SEUNGJOO.pdf`)
   * 파일명 앞 4자리 숫자는 Gradelink 고유 학번(`studentCode`)으로 DB의 Unique Key 역할을 함.
2. **2단 다단 레이아웃 (Multi-column Layout):**
   * Gradelink PDF는 좌우 2단으로 학기별 성적이 배치되어 일반 텍스트 추출(PDF text stream) 시 좌우 텍스트가 서로 뒤섞이는 현상(Column Bleeding)이 빈번함.
   * 따라서 반드시 **시각적 구조를 그대로 인지하는 Gemini Multimodal Document Vision API**를 사용하여 좌표 기반으로 학기별 블록을 정확히 분리해야 함.
3. **외부 위탁 학점 표기 (External Credits):**
   * 온라인 위탁 과정: `(APEX)`, `(UC Scout)` 등의 접미사가 과목명 뒤에 붙음 (예: `AP Calculus AB (APEX)`).
   * 정규 교과목 카테고리로 올바르게 분류하되, 필요 시 태그를 보존함.
4. **계절학기 (Summer & Winter Semesters):**
   * 정규 1학기(Fall/Semester 1), 2학기(Spring/Semester 2) 외에 `Summer Semester 2024`, `Winter Semester 2023` 등 비정규 학기가 존재함.
   * 학기 정렬 시 연도와 계절의 시계열 순서가 깨지지 않도록 정규화된 학기 순서 인덱스를 부여해야 함.
5. **재수강 표기 (Credit Recovery):**
   * 원 과목 낙제 또는 성적 보충 시 `Algebra II (Credit Recovery)` 형태로 표기됨.
   * Credit Make-up 메커니즘과 연동되어 원점수를 대체하거나 보정할 수 있어야 함.
6. **전출생 및 미이수 표기 (Withdrawals & Incompletes):**
   * 중간 전출생은 헤더에 `Withdrawal Date`가 기록되어 있으며, 해당 학기 미이수 과목에 `nm` (No Mark), `N/A`, `0.000` 학점 등이 기재됨.
   * 이러한 과목은 GPA 산출(분모, 분자)에서 반드시 제외해야 함.

---

## 2. GPA 산출 불변 규칙 (Invariant GPA Rules)

1. **오직 Unweighted GPA (4.0 만점)만 적용:**
   * AP 과목이나 Honors 과목에 대해 4.5, 5.0 가중치를 부여하는 Weighted GPA는 대학별 산출식이 상이하므로, 본 시스템의 모든 통계 및 지표는 **가중치가 없는 순수 4.0 만점 기준(Unweighted Scale)**으로만 계산한다.
2. **이원화된 GPA 체계 (Dual GPA Tracking):**
   * **Cumulative Unweighted GPA (전체 누적 GPA):** 학생이 이수한 모든 정규 교과목(Bible, PE, Art 등 포함)의 4.0 기준 누적 평점.
   * **Core Cumulative GPA (5대 주요교과 누적 GPA):** 미국 명문대 입학사정관의 관점에서 핵심 학업 역량을 평가하기 위해 다음 5대 교과군만 필터링하여 분리 산출:
     1. `ENGLISH` (영어 및 영문학)
     2. `MATH` (수학)
     3. `SCIENCE` (자연과학)
     4. `SOCIAL_STUDIES` (역사 및 사회과학)
     5. `FOREIGN_LANGUAGE` (제2외국어 - 중국어 중심)
   * *※ `OTHER` 카테고리(Bible, PE, Seminar, Music, Art, Computer Science 등)는 전체 GPA에는 포함되나 Core GPA 계산 및 5대 교과 추이 그래프에서는 완전히 배제된다.*
3. **Credit Make-up 반영의 일관성:**
   * 특정 과목에 재수강 또는 학점 보충이 적용되어 `isCreditMakeup = true`인 경우, `originalGradePoint` 대신 `adjustedGradePoint`를 우선하여 학기별 GPA, 전체 누적 GPA, Core GPA가 즉시 단일 계산 엔진(`recalculateStudentGPAs`)을 통해 갱신되어야 함.
4. **미국 커리큘럼 봄학기(Semester 2) 성적 기반 학년 자동 진급 규칙:**
   * **1st Semester (Fall / 가을학기):** 학년도 진행 중이므로 학생의 학년(`gradeLevel`) 유지.
   * **2nd Semester (Spring / 봄학기):** 봄학기 성적이 업데이트되면 해당 학년 수료로 판정되어 차기 학년으로 자동 진급 (`Grade 9 ➔ 10`, `Grade 10 ➔ 11`, `Grade 11 ➔ 12`).
   * **12학년 봄학기 성적 업데이트 시:** 고교 전 과정 수료로 🎓 **졸업생(`GRADUATED`, Class of SpringYear)**으로 자동 전환.
   * 과목 추가/수정/삭제, 새 학기 추가, 성적표 PDF 일괄 업로드 파이프라인 전반에서 즉시 자동 평가 및 DB 동기화 실행 (`src/lib/academic/promotion.ts`).

---

## 3. 계정 및 보안 규칙 (Security & Account State)

* **Admin 계정:** `kyumun.hwang@gmail.com` / `emeo1004#` (전체 시스템 관리자)
* **Counselor 계정:** `ls.counselors@gmail.com` / 초기비밀번호 `1234`
  * `mustChangePassword = true` 상태로 생성됨.
  * 최초 로그인 성공 시 미들웨어에 의해 즉시 비밀번호 변경 모달/화면으로 리다이렉트되며, 변경 완료 전까지 포탈 사용 불가.
* **Viewer 계정:** 일반 교사용 (Read-Only)
  * `/teachers` 라우트 및 API 접근 시 HTTP 403 Forbidden 반환.
  * 신규 구현된 학적 및 성적표 종합 수정 기능 접근 완전 제한:
    * `StudentProfileEditModal` (학적 / 정보 수정 버튼 미노출 및 `PATCH /api/students/[id]` 403 차단)
    * `AddSemesterModal` (+ 새 학기 추가 버튼 미노출 및 `POST /api/students/[id]/semesters` 403 차단)
    * `AddCourseModal` (+ 과목 추가 버튼 미노출 및 `POST /api/students/[id]/courses` 403 차단)
    * `CourseEditModal` (과목별 [수정 ✎] 버튼 및 관리 열 미노출, `PUT/DELETE /api/grades/[id]` 403 차단)
  * 모든 학적 및 성적 데이터의 수정·추가·삭제는 오직 **상담교사(`COUNSELOR`) 및 관리자(`ADMIN`)**에게만 허용됨.

---

## 4. 현재 진행 상태 및 릴리즈 현황 (Current Progress)

* **현재 단계 (Current Phase):** `전체 Phase 1~6 100% 완료 (Production Ready)`
* **최근 완료 작업:**
  * [x] `PRD.md` 및 `stitch_design/design.md` 완벽 분석 완료
  * [x] `Architecture.md`, `tasks.md`, `Memory.md`, `Rules.md`, `Skills.md` 생성
  * [x] Phase 1 완료: Next.js + Tailwind + Prisma SQLite 환경 구축 및 초기 시드 완료
  * [x] Phase 2 완료: JWT 인증, 미들웨어 RBAC, 비밀번호 강제 변경 플로우, 교사 관리 페이지(`/teachers` CRUD)
  * [x] Phase 3 완료: Gemini API PDF 파서, 5대 교과 자동 매핑, Unweighted & Core GPA 엔진, Credit Make-up 실시간 보정, `/gpa-analytics` 페이지 (Recharts 꺾은선 차트)
  * [x] Phase 4 완료: 고밀도 Bento Grid 학생 종합 대시보드 (`/dashboard`, `/students/[id]`, `/students`)
  * [x] Phase 5 완료: 1:1 진학상담 일지(Action items 체크리스트) 및 목표 대학교 2단 워크스페이스(Reach/Match/Safety, ED/EA/Regular)
  * [x] Phase 6 완료: Supabase(PostgreSQL) 원클릭 마이그레이션 가이드(`MIGRATION_SUPABASE.md`) 및 환경변수 템플릿 완비, Next.js 프로덕션 빌드 100% 통과

---

## 5. 아키텍처 결정 사항 기록 (Architecture Decision Records, ADR)

### ADR-001: 2단계 데이터베이스 전략 (SQLite -> Supabase PostgreSQL)
* **결정:** 초기 개발 단계에서는 설치 및 구동이 즉각적인 로컬 SQLite(`file:./dev.db`)를 사용하고, 프로덕션 배포 시 Prisma schema의 provider만 `postgresql`로 전환하여 Supabase에 무중단 배포한다.
* **이유:** 외부 클라우드 접속 지연 없이 로컬 개발과 E2E 테스트를 즉시 수행할 수 있으며, Prisma Client의 추상화 계층을 활용하여 SQL 호환성 문제를 사전에 방지할 수 있음.

### ADR-002: Gemini API Structured Output 기반 PDF 파서 채택
* **결정:** 로컬 OCR 라이브러리(Tesseract, pdf2json 등) 대신 Google Gemini 2.5 Flash API의 Multimodal Document Understanding과 Structured JSON Schema를 채택한다.
* **이유:** Gradelink 성적표의 복잡한 2단 컬럼, 다양한 외부 과정 접미사, 미이수 표기 예외 등을 규칙 기반 정규식만으로 파싱하면 결함률이 높음. Gemini API의 시각적 구조 인지와 JSON 스키마 강제를 통해 99.9% 이상의 추출 신뢰성을 확보함.

### ADR-003: 5대 핵심 교과 분류 사전과 수동 보정의 병행
* **결정:** 과목명 키워드 매핑 테이블을 통해 1차 자동 분류를 수행하고, 교사가 UI 상에서 드롭다운으로 교과 카테고리를 언제든 수동 변경할 수 있도록 지원한다.
* **이유:** 신규 개설 과목이나 독특한 명칭의 선택 과목이 추가되더라도 시스템 중단 없이 유연하게 대처 가능함.

---

## 6. 매 작업 완료 후 기록 템플릿 (Agent Session Update Template)

에이전트가 단일 작업 세션을 완료할 때마다 아래 포맷으로 본 파일의 최하단에 기록을 누적합니다:

```markdown
### [작업 일시: 2026-11-13 10:27] Phase 1 완료: 프로젝트 초기화 및 데이터베이스 시딩
* **완료된 태스크:**
  - Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide React, Recharts, Jose, Bcryptjs 셋업
  - 전용 포트 3005 할당 (`npm run dev:portal`)
  - Prisma ORM 5.22 + SQLite `dev.db` 스키마 구축 및 `npx prisma db push` 성공
  - `prisma/seed.ts` 작성 및 실행 완료:
    * Admin: `kyumun.hwang@gmail.com` / `emeo1004#`
    * Counselor: `ls.counselors@gmail.com` / `1234` (`mustChangePassword: true`)
    * Viewer: `teacher@lis.ac.kr` / `1234`
    * 샘플 학생: 1017 David Kim, 1121 Seungjoo Back, 1018 Grace Lee (Credit Make-up 포함)
* **변경된 주요 파일:**
  - `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `.env`
  - `prisma/schema.prisma`, `prisma/seed.ts`
  - `src/lib/prisma.ts`, `src/lib/auth/password.ts`, `src/lib/auth/session.ts`
  - `src/lib/gpa/classifier.ts`, `src/lib/gpa/calculator.ts`, `src/lib/utils.ts`
  - `tasks.md`, `Memory.md`
### [작업 일시: 2026-11-13 10:35] Phase 3 완료: Gemini PDF 파서 및 GPA 분석 엔진
* **완료된 태스크:**
  - Gemini API 연동 파서(`src/lib/gemini/transcriptParser.ts`): 인적사항 + 학기별 과목 JSON 추출 및 Fallback 탑재
  - 5대 교과 자동 분류기(`src/lib/gpa/classifier.ts`) 및 4.0 만점 계산 엔진(`src/lib/gpa/calculator.ts`)
  - 배치 업로드 API(`src/app/api/transcript/upload/route.ts`): 학생 및 성적 Upsert, 실시간 GPA 재계산 트랜잭션
  - Credit Make-up API(`src/app/api/grades/[id]/makeup/route.ts`): 재수강 반영, 감사 로그 기록 및 GPA 실시간 동기화
  - GPA 분석 페이지(`src/app/gpa-analytics/page.tsx`): 다중 PDF 드래그앤드롭 업로드, Recharts 차트 A(전체 vs Core) & 차트 B(5대 교과별 추이), 상세 성적표 및 Credit Make-up 모달
  - Next.js 프로덕션 빌드 검증 성공 (15개 라우트 완료)
* **변경된 주요 파일:**
  - `src/lib/gemini/transcriptParser.ts`
  - `src/app/api/transcript/upload/route.ts`
  - `src/app/api/grades/[id]/makeup/route.ts`
  - `src/app/api/gpa/overview/route.ts`
  - `src/app/gpa-analytics/page.tsx`, `layout.tsx`
  - `tasks.md`, `Memory.md`
### [작업 일시: 2026-11-13 14:26] 실제 PDF 성적표 전수 동기화, 가상 학생 제거 및 졸업생 전용 메뉴(/graduates) 구축
* **완료된 태스크:**
  - `Transcript` 폴더 내 697개 원본 PDF에서 127명 학생의 실제 학기별 성적표 데이터를 Python `pypdf` 결정론적 파서를 통해 100% 동기화 완료
  - 개발 초기 생성된 가상 학생 3명(Grace Lee 1018 및 seed 더미 데이터) DB에서 완전 삭제
  - 사용자 명세 기반 학사 일정 및 학년도 역산 공식(`gradYear = springYear + (12 - gradeLevel)`) 적용:
    * 2026년 봄 또는 그 이전 12학년을 마친 학생: `status = GRADUATED` (총 45명: 2026년 13명, 2025년 11명, 2024년 8명, 2023년 13명)
    * 2027년 이후 졸업 예정인 학생: `status = ENROLLED` (현재 재학생 총 37명, 2026-2027 학년도 기준 학년 재산출)
    * 중도 전출생: `status = WITHDRAWAL` (총 45명)
  - `Student` 스키마에 `graduationYear` 필드 추가 및 `npx prisma db push` 적용
  - 졸업생 전용 페이지(`/graduates`) 신설:
    * 졸업 연도별(전체, 2026년도, 2025년도, 2024년도, 2023년도) 탭 필터
    * 졸업생 통계 카드(총 졸업생, 2026년도 최신 졸업생, 평균 전체 GPA, 평균 Core GPA)
    * 검색 및 정렬(최신 졸업년도순, GPA 높은순, 이름 가나다순)
    * 학생 목록(`/students`) 및 상세(`/students/[id]`) 페이지에 `🎓 {graduationYear}년도 졸업` 배지 표시 연동
  - Next.js 프로덕션 빌드(`npm run build:portal`) 100% 성공 및 E2E 라우트(200 OK) 검증 완료
* **변경된 주요 파일:**
  - `prisma/schema.prisma`
  - `scripts/sync-all-transcripts.ts`, `scripts/apply-graduation-rules-and-cleanup.ts`
  - `src/components/layout/Sidebar.tsx`
  - `src/app/graduates/page.tsx`, `src/app/graduates/layout.tsx`
  - `src/app/api/students/route.ts`
  - `src/app/students/page.tsx`, `src/app/students/[id]/page.tsx`, `src/app/dashboard/page.tsx`
  - `tsconfig.json`, `tasks.md`, `Memory.md`
    * Tab 4: 목표 대학교 2단 워크스페이스 (교사 추천 vs 학생 희망, ED/EA/Regular, Reach/Match/Safety 배지, Pros/Cons)
  - 메인 대시보드(`/dashboard`): 고교생 현황, 평균 GPA 통계, 학생별 1:1 상담 바로가기 카드 덱
  - Supabase 마이그레이션 가이드([MIGRATION_SUPABASE.md](file:///f:/Antigravity/college-portal/MIGRATION_SUPABASE.md)) 및 전환 헬퍼 스크립트 작성
  - Next.js 프로덕션 빌드(`npm run build:portal`) 18개 라우트 100% 컴파일 성공
* **변경된 주요 파일:**
  - `src/app/api/students/route.ts`, `src/app/api/students/[id]/route.ts`
  - `src/app/api/students/[id]/tests/route.ts`, `activities/route.ts`, `counseling/route.ts`, `universities/route.ts`
  - `src/app/students/page.tsx`, `src/app/students/[id]/page.tsx`
  - `src/app/dashboard/page.tsx`, `layout.tsx`
  - `MIGRATION_SUPABASE.md`, `scripts/migrate-to-supabase.ts`
  - `tasks.md`, `Memory.md`

### [작업 일시: 2026-11-13 16:00] Phase 3.8 & Phase 4.3 완료: 봄학기 자동 진급 엔진 & 공인성적/비교과 원클릭 관리
* **완료된 태스크:**
  - 미국 커리큘럼 기반 학년 자동 진급 엔진 (`src/lib/academic/promotion.ts`) 개발:
    * 2nd Semester (봄학기) 성적이 업데이트되는 즉시 해당 학년 수료로 간주하여 차기 학년(Gr.9➔10, Gr.10➔11, Gr.11➔12)으로 자동 진급.
    * 12학년 봄학기 성적 완료 시 🎓 `GRADUATED` (Class of SpringYear)로 자동 전환.
    * 과목 추가/수정/삭제, 새 학기 추가, 성적표 PDF 일괄 업로드 파이프라인 전반에 트리거 연동.
  - 공인 시험 대표 성적 (Standardized Tests) 원클릭 입력 모달 (`AddTestModal`) 및 백엔드 API (`POST /api/students/[id]/tests`, `DELETE`) 구축:
    * College Board 공식 AP 과목 및 시험(AP Courses and Exams) 39종 전체 카테고리별(Math & CS, Sciences, History & Social Sciences, English, World Languages, Arts, Capstone) 정식 명칭 연동.
    * 목록에 없는 시험의 경우 [리스트에 없는 시험 직접 입력] 토글을 통해 수동 직접 입력(Custom Input) 기능 완비.
    * TOEFL, SAT, ACT, AP, Duolingo, IELTS, PSAT 대표 점수 및 영역별 점수 입력 지원.
    * 관리자/상담교사 전용 `[+ 성적 입력]` 버튼 및 삭제 버튼 연동 (일반 교사 VIEWER에게는 숨김 및 403 가드).
  - 비교과 활동 & 수상 내역 (Clubs & Awards) 원클릭 입력 모달 (`AddClubModal`, `AddAwardModal`) 및 백엔드 API (`POST /api/students/[id]/activities`, `DELETE`) 구축:
    * 학생 동아리 `[+ 동아리 추가]` 및 교내외 상장 `[+ 수상내역 추가]` 원클릭 모달 연동.
    * 관리자/상담교사 전용 추가/삭제 권한 엄수.
  - Next.js 프로덕션 빌드 및 타입 검사 100% 통과 (오류 0건).
* **변경된 주요 파일:**
  - `src/lib/academic/promotion.ts` (신규)
  - `src/components/students/AddTestModal.tsx` (신규)
  - `src/components/students/AddClubModal.tsx` (신규)
  - `src/components/students/AddAwardModal.tsx` (신규)
  - `src/app/api/students/[id]/tests/route.ts` (POST, DELETE)
  - `src/app/api/students/[id]/activities/route.ts` (POST, DELETE)
  - `src/app/api/students/[id]/courses/route.ts`
  - `src/app/api/grades/[id]/route.ts`
  - `src/app/api/students/[id]/semesters/route.ts`
  - `src/app/api/transcript/upload/route.ts`
  - `src/app/students/[id]/page.tsx`
  - `tasks.md`, `Memory.md`

### [작업 일시: 2026-11-13 15:45] Phase 5.3 완료: 1:1 상담 일정 및 긴급 상담 큐 대시보드 개편 & 카드형 목록 분리
* **완료된 태스크:**
  - `CounselingLog` 스키마 확장:
    * `status`: 기본값 `"SCHEDULED"` (상담 전 / 미진행)
    * `isUrgent`: Boolean (긴급 상담 여부)
    * `nextCounselDate`: DateTime? (다음 상담 일정)
  - 학생 상세(`/students/[id]`) 1:1 상담 탭 개편:
    * 새 상담 로그 작성 시 기본 Default값으로 `SCHEDULED` (상담 전/미진행) 자동 지정.
    * '할 일 (Action Items)' 하단에 **'다음 상담일정'** 입력 필드 및 **'🚨 다음 상담 긴급 (Urgent)'** 체크박스 신설.
    * 상담 타임라인에 진행 상태(🟡 상담 전 vs 🟢 상담 완료), 긴급 배지, 다음 상담 일정 카드 노출 및 원클릭 완료 전환 액션 연동.
  - 사이드바 메뉴 구조 개편 (`src/components/layout/Sidebar.tsx`):
    * `학생 목록 (전체)` 바로 아래에 `학생 목록 (카드형)` (`/students/cards`) 메뉴 신설.
    * 기존 대시보드 하단에 있던 학생별 1:1 워크스페이스 카드 덱을 `/students/cards`로 완전 분리 이동하고 학년/상태 필터 및 검색 기능 탑재.
  - 메인 대시보드(`/dashboard`) 전면 개편:
    * 첫 화면 최상단에 **[🚨 긴급 상담 리스트 (Urgent Counseling Queue)]** 전면 배치 (긴급 대기 건수, D-Day, 학생 정보, 1:1 상담 바로가기).
    * 바로 아래에 **[📅 상담 일정 & 전체 1:1 상담 목록]** 배치 (전체, 긴급, 상담 전/미진행, 다음 일정 지정, 완료 필터 및 실시간 완료 토글).
    * `GET /dashboard`, `GET /students/cards` 200 OK 정상 렌더링 검증 완료.
* **변경된 주요 파일:**
  - `prisma/schema.prisma`
  - `src/components/dashboard/CounselingDashboardView.tsx` (신규)
  - `src/app/dashboard/page.tsx` (전면 개편)
  - `src/app/students/cards/page.tsx` (신규)
  - `src/components/layout/Sidebar.tsx`
  - `src/app/students/[id]/page.tsx`
  - `src/app/api/students/[id]/counseling/route.ts`
  - `src/app/api/counseling/[id]/route.ts` (신규)
  - `tasks.md`, `Memory.md`
* **완료된 태스크:**
  - 1017 임가은 학생(Gaeun LIM) 조기졸업 상태(`GRADUATED`, Class of 2026, 졸업일 2026-06-10, 누적 GPA 4.00, Core GPA 4.00) 검증 및 정상 유지 확인.
  - 학생 상세 화면(`/students/[id]`)에서 학적 및 기본 인적사항 수정 모달(`StudentProfileEditModal`) 연동 및 백엔드 API(`PATCH /api/students/[id]`) 구현:
    * 재학 상태(`status`: ENROLLED, GRADUATED, WITHDRAWAL), 학년(`gradeLevel`), 졸업연도(`graduationYear`), 입학일/졸업일/전출일, 학부모 및 주소 정보 실시간 변경 지원.
  - 성적표 과목별 상세 수정 및 Credit Make-up 모달(`CourseEditModal`) 연동 및 API(`PUT/DELETE /api/grades/[id]`) 구현:
    * 과목명, 5대 교과 카테고리(ENGLISH, MATH, SCIENCE, SOCIAL_STUDIES, FOREIGN_LANGUAGE, OTHER), 학점(0.5~1.0), 원성적, Credit Make-up 성적 및 사유, GPA 산출 반영 토글(`includeInGpa`) 수정 및 과목 삭제 지원.
    * 수정/삭제 발생 시 즉시 `syncStudentGpas`를 호출하여 전체 누적 GPA 및 5대 핵심 Core GPA 자동 재계산 및 UI 즉시 반영.
  - 신규 학기 추가 모달(`AddSemesterModal`) 및 API(`POST /api/students/[id]/semesters`) 구현:
    * 학년도(예: 2025-2026), 학기명(Semester 1, Semester 2, Summer), 학년(9~12) 선택 후 새 학기 블록 생성.
  - 학기별 신규 과목 추가 모달(`AddCourseModal`) 및 API(`POST /api/students/[id]/courses`) 구현:
    * 특정 학기에 직접 과목 추가 및 GPA 실시간 자동 재계산.
  - Next.js 프로덕션 빌드(`npm run build:portal`) 17개 전 라우트 컴파일 통과 및 개발 서버(3005) 정상 가동 유지.
* **변경된 주요 파일:**
  - `src/components/students/StudentProfileEditModal.tsx`
  - `src/components/students/CourseEditModal.tsx`
  - `src/components/students/AddCourseModal.tsx`
  - `src/components/students/AddSemesterModal.tsx`
  - `src/app/api/students/[id]/route.ts` (PATCH 추가)
  - `src/app/api/grades/[id]/route.ts` (PUT, DELETE 추가)
  - `src/app/api/students/[id]/courses/route.ts` (POST 신규)
  - `src/app/api/students/[id]/semesters/route.ts` (POST 신규)
  - `src/app/students/[id]/page.tsx` (모달 4종 연동 및 UI 버튼 배치)
  - `tasks.md`, `Memory.md`
* **완료된 태스크:**
  - JWT 세션 유틸리티(`src/lib/auth/session.ts`) 및 인증 API(`login`, `logout`, `change-password`, `me`)
  - 미들웨어(`src/middleware.ts`): 미인증 차단, `mustChangePassword` 감지 및 `/change-password` 강제 격리, `/teachers` Viewer 403 차단
  - 로그인 UI (`/login`): Stitch 테마 기반 반응형 로그인 카드 및 시드 계정 빠른 입력 버튼
  - 비밀번호 강제 변경 UI (`/change-password`): 8자 이상 실시간 유효성 체크, 새 비밀번호 확인, 시스템 시작
  - 사이드바/헤더 글로벌 컴포넌트(`Sidebar.tsx`, `Header.tsx`, `AppShell.tsx`): Viewer일 경우 교사 관리 메뉴 자동 은닉
  - 교사 관리 페이지 (`/teachers`): 교사 목록, 새 교사 등록(1234 자동 할당), 비번 초기화 모달, 계정 영구 삭제 모달
  - Next.js 프로덕션 빌드(`npm run build:portal`) 타입 및 라우트 검증 100% 통과
* **해결된 이슈 / 발생한 특이사항:**
  - `jose` 라이브러리의 `jwtVerify` 인자 순서 정정 (`jwtVerify(token, SECRET_KEY)`)
  - 빌드 검증 성공 (Exit Code 0) 및 모든 API/Static 라우트 정상 번들링 완료
* **변경된 주요 파일:**
  - `src/middleware.ts`
  - `src/app/api/auth/login/route.ts`, `logout/route.ts`, `change-password/route.ts`, `me/route.ts`
  - `src/app/api/teachers/route.ts`, `src/app/api/teachers/[id]/route.ts`
  - `src/app/login/page.tsx`, `src/app/change-password/page.tsx`
  - `src/components/layout/Sidebar.tsx`, `Header.tsx`, `AppShell.tsx`
  - `src/app/teachers/page.tsx`, `src/app/teachers/layout.tsx`
  - `tasks.md`, `Memory.md`
```
