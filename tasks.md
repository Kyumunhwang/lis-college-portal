# 등대교육공동체 진학상담포탈 단계별 구현 체크리스트 (tasks.md)

이 문서는 Antigravity 개발 에이전트가 각 단계를 순차적으로 실행하고 진행 상황을 추적하기 위한 마스터 체크리스트입니다. 각 작업이 완료될 때마다 즉시 `[ ]`를 `[x]`로 갱신합니다.

---

## Phase 1: 프로젝트 환경 설정 및 데이터베이스 기반 구축

- [x] **1.1 Next.js 14+ 및 개발 환경 셋업**
  - [x] Next.js (App Router, TypeScript, Tailwind CSS) 프로젝트 초기화 및 디렉토리 구조 설정
  - [x] 아이콘 라이브러리(`lucide-react`) 및 차트 라이브러리(`recharts`) 설치
  - [x] UI/UX 유틸리티(`clsx`, `tailwind-merge`) 및 비밀번호 해싱 라이브러리(`bcryptjs`) 설치
  - [x] 세션 관리 라이브러리(`jose` / JWT) 설치
  - [x] 프로젝트 전용 포트 할당 및 package.json 스크립트 설정 (`PORT=3005`)

- [x] **1.2 Prisma ORM 및 SQLite 로컬 데이터베이스 구성**
  - [x] Prisma CLI 및 클라이언트 설치 (`prisma`, `@prisma/client`)
  - [x] `prisma/schema.prisma` 파일 작성 (Architecture.md 기준: User, Student, SemesterRecord, CourseGrade, GradeAuditLog, StandardizedTest, ClubActivity, AwardRecord, CounselingLog, TargetUniversity)
  - [x] SQLite 로컬 DB 마이그레이션 실행 (`npx prisma db push` 또는 `migrate dev`)
  - [x] Prisma Client 싱글톤 인스턴스 모듈(`src/lib/prisma.ts`) 구성

- [x] **1.3 데이터베이스 시드 스크립트 작성 및 실행 (`prisma/seed.ts`)**
  - [x] Admin 계정 시드: `kyumun.hwang@gmail.com` / `emeo1004#` (Role: ADMIN, mustChangePassword: false)
  - [x] Counselor 계정 시드: `ls.counselors@gmail.com` / `1234` (Role: COUNSELOR, mustChangePassword: true)
  - [x] Viewer 샘플 교사 계정 시드: `teacher@lis.ac.kr` / `1234` (Role: VIEWER)
  - [x] 샘플 고등학생(9~12학년) 3명 데이터 생성 (학번 1017 David Kim, 1121 Seungjoo Back, 1018 Grace Lee)
  - [x] 샘플 학기별 성적, 공인성적(TOEFL 112, SAT 1520, AP Calc BC 5 등), 클럽 및 수상 데이터 시딩
  - [x] 시드 스크립트 실행 검증 (`npx prisma db seed`)

---

## Phase 2: 인증(Auth), RBAC 미들웨어 및 교사 관리 페이지 (`/teachers`)

- [x] **2.1 인증 및 세션 인프라 구축**
  - [x] 비밀번호 해시 및 검증 유틸리티(`src/lib/auth/password.ts`) 구현
  - [x] JWT 세션 토큰 발행 및 쿠키 설정 유틸리티(`src/lib/auth/session.ts`) 구현
  - [x] 로그인 API Route (`/api/auth/login`) 및 로그아웃 API Route (`/api/auth/logout`) 구현
  - [x] 미들웨어(`middleware.ts`) 작성: 인증 보호, `mustChangePassword` 강제 리다이렉트, `/teachers` Viewer 차단(403)

- [x] **2.2 로그인 UI 및 비밀번호 강제 변경 플로우**
  - [x] 로그인 화면 (`/login`): Stitch 디자인 토큰(Navy-900, Slate-50) 기반 반응형 로그인 카드
  - [x] `ls.counselors@gmail.com` 최초 로그인 시 감지 모달 또는 전용 페이지 (`/change-password`) 구현
  - [x] 새 비밀번호 유효성 검사 (8자 이상, 대소문자/숫자/특수문자 조합) 실시간 피드백
  - [x] 비밀번호 변경 API (`/api/auth/change-password`) 연동 후 `mustChangePassword: false` 갱신 및 대시보드 리다이렉트

- [x] **2.3 글로벌 네비게이션 및 사이드바 RBAC 적용**
  - [x] 좌측 사이드바 레이아웃 (`src/components/layout/Sidebar.tsx`): 240px 너비, Bento 아이콘 네비게이션
  - [x] 상단 글로벌 헤더 (`src/components/layout/Header.tsx`): 교사 프로필, 역할 배지, 빠른 학생 검색창(⌘K), 로그아웃 버튼
  - [x] RBAC UI 은닉: 세션 Role이 `VIEWER`일 경우 사이드바에서 `[교사 계정 관리]` 메뉴 미노출

- [x] **2.4 교사 계정 관리 페이지 (`/teachers` - Admin & Counselor 전용)**
  - [x] 교사 목록 테이블: 이름, 이메일, 역할(Admin/Counselor/Viewer 배지), 최종 로그인, 상태, 관리 액션
  - [x] 신규 교사 등록 모달: 이름, 이메일, 권한 선택, 초기 비밀번호 `1234` 자동 할당 및 `mustChangePassword: true` 설정
  - [x] 교사 비밀번호 초기화 모달: 임시 비밀번호(`1234`) 재설정 기능
  - [x] 교사 계정 삭제 모달: 삭제 시 경고 컨펌 모달 및 안전 삭제 처리

---

## Phase 3: Gemini API 기반 Gradelink PDF 파서 및 GPA 계산 엔진

- [x] **3.1 핵심 GPA 계산 및 카테고리 분류 유틸리티 구현**
  - [x] 5대 핵심 교과 분류 함수 (`src/lib/gpa/classifier.ts`): 과목명을 분석하여 ENGLISH, MATH, SCIENCE, SOCIAL_STUDIES, FOREIGN_LANGUAGE, OTHER로 자동 매핑
  - [x] 4.0 만점 Unweighted 환산 테이블 및 알고리즘 (`src/lib/gpa/calculator.ts`)
  - [x] 학기별 Term GPA 및 Term Core GPA 계산 함수
  - [x] 전체 누적 Cumulative Unweighted GPA 및 Core Cumulative GPA 재계산 함수
  - [x] Credit Make-up 적용 시 adjustedGradePoint 우선 반영 로직 단위 테스트 작성

- [x] **3.2 Gemini API 연동 Gradelink PDF 파서 모듈 (`src/lib/gemini/transcriptParser.ts`)**
  - [x] Google GenAI SDK 설정 (`GEMINI_API_KEY` 환경변수 연동)
  - [x] Gradelink Transcript 특화 Gemini Document 분석 프롬프트 및 JSON Response Schema 정의
  - [x] 학생 인적사항(학번, 영문이름, 생년월일, 입학/졸업/전출일) 추출 로직
  - [x] 학기별 과목 리스트(Class Title, Credits, Letter Grade, Percentage) 추출 로직
  - [x] APEX, UC Scout 외부 학점 및 계절학기, 전출생(nm, 0.000) 예외 처리 로직

- [x] **3.3 PDF 일괄 업로드 UI 및 배치 파이프라인 (`/gpa-analytics`)**
  - [x] 다중 PDF 드래그 앤 드롭 업로드 컴포넌트 (최대 50개 파일 지원)
  - [x] 파일 업로드 및 배치 파싱 백엔드 API (`/api/transcript/upload`)
  - [x] 파일명(`{학번} - {성, 이름}.pdf`) 및 본문 학번 기반 학생 자동 매칭 / 신규 생성 Upsert 로직
  - [x] 실시간 파싱 진행률 프로그레스 바(Progress Bar) 및 파일별 성공/실패 상태 리포트 UI

- [x] **3.4 성적 수동 보정 및 Credit Make-up 기능**
  - [x] 개별 과목 성적 수정 모달 컴포넌트 (`CreditMakeUpModal.tsx` / `page.tsx`)
  - [x] 성적 수정 API (`/api/grades/[id]/makeup`): 수정된 Grade, 수정 사유 기록 및 GradeAuditLog 생성
  - [x] 성적 수정 완료 즉시 `recalculateStudentGPAs` 실행하여 해당 학생의 전체 GPA/Core GPA 실시간 갱신
  - [x] 성적표 테이블에 Amber 컬러의 `[재수강/수정됨]` 배지 및 툴팁 이력 표시

- [x] **3.5 실제 PDF 전수 동기화 및 가상 학생 정리**
  - [x] Python `pypdf` 결정론적 고정밀 파서 탑재: API 키 없이도 697개 실제 PDF에서 학기/과목/GPA 100% 추출
  - [x] 개발 초기 생성된 가상 학생(Grace Lee 1018 및 seed 더미 데이터) 완전 삭제
  - [x] 학사 일정 역산 알고리즘(Grade Level & Academic Year 연동)을 통한 졸업 연도(`graduationYear`) 및 상태(`GRADUATED` 45명, `ENROLLED` 37명, `WITHDRAWAL` 45명) 분류

- [x] **3.6 졸업생 전용 메뉴 및 관리 페이지 (`/graduates`) 구축**
  - [x] 좌측 사이드바 `졸업생 관리` (`/graduates`) 메뉴 신설
  - [x] 졸업 연도별(2026년도, 2025년도, 2024년도, 2023년도) 탭 필터, 검색, 정렬 및 요약 KPI 카드
  - [x] 학생 목록(`/students`) 및 상세(`/students/[id]`) 화면에 `🎓 {graduationYear}년도 졸업` 배지 표시 연동

- [x] **3.7 학생 학적 상태 및 성적표(GPA 상세/과목/학기) 통합 수정 관리 기능 구축**
  - [x] 학생 인적사항 및 학적상태 수정 모달 (`StudentProfileEditModal`) 타이틀 정돈 (`학생 학적 및 기본 정보 수정`으로 통일, 학번 괄호 제거)
  - [x] RBAC 권한 엄수: 학적 정보 수정, 새 학기 추가, 과목 추가, 과목 수정/삭제는 **상담교사(`COUNSELOR`) 및 관리자(`ADMIN`) 전용**으로 제한하고, 일반교사(`VIEWER`)에게는 수정/추가 버튼 노출 차단 및 백엔드 403 Forbidden 철저 가드
  - [x] 학생 인적사항 및 학적상태 수정 모달 (`StudentProfileEditModal`) 및 API (`PATCH /api/students/[id]`) 구현 (재학/졸업/전출 상태, 졸업연도, 졸업일자, 보호자 정보 등 수정)
  - [x] 과목별 상세 수정 및 Credit Make-up 모달 (`CourseEditModal`) 및 API (`PUT /api/grades/[id]`, `DELETE /api/grades/[id]`) 구현 (과목명, 5대 교과 분류, 학점, 원성적, Make-up 성적, GPA 반영 토글, 과목 삭제 및 GPA 실시간 자동 재계산)
  - [x] 신규 과목 추가 모달 (`AddCourseModal`) 및 API (`POST /api/students/[id]/courses`) 구현
  - [x] 신규 학기 추가 모달 (`AddSemesterModal`) 및 API (`POST /api/students/[id]/semesters`) 구현
  - [x] 조기졸업생(예: 1017 임가은 학생 - 2025-2026 2학기 없이 조기 졸업) 및 특수 학적 케이스의 졸업생 분류 검증 완료 (`GRADUATED`, Class of 2026)

- [x] **3.8 미국 커리큘럼 봄학기(Semester 2) 성적 기반 학년 자동 진급 및 졸업 처리 엔진 구축**
  - [x] 전용 학년 진급 모듈 (`src/lib/academic/promotion.ts`) 개발:
    * 1st Semester (Fall / 가을학기): 해당 학년도 진행 중 -> 학년 유지
    * 2nd Semester (Spring / 봄학기): 성적 업데이트 완료 시 해당 학년 수료 판정 -> 차기 학년(Gr.9➔10, Gr.10➔11, Gr.11➔12)으로 자동 진급
    * 12학년 봄학기(Semester 2) 성적 완료 시 고교 전 과정 수료 판정 ➔ 🎓 졸업(`GRADUATED`, Class of SpringYear)으로 자동 전환
  - [x] 과목 추가/수정/삭제 (`syncStudentGpas`), 새 학기 추가 (`POST /api/students/[id]/semesters`), 성적표 PDF 일괄 업로드 (`POST /api/transcript/upload`) 파이프라인 전반에 자동 진급 트리거 연동 완료
  - [x] 전체 127명 재학생/졸업생/전출생 진급 전수 검증 완료 (74명 봄학기 완료 학생 자동 진급 성공)

---

## Phase 4: 학생 통합 대시보드 및 GPA 시각화 분석

- [x] **4.1 학생 목록 및 검색 필터 페이지 (`/students`)**
  - [x] 학번, 학생명(한글/영문), 학년(9~12), 재학 상태(Enrolled, Withdrawal 등) 복합 검색 필터
  - [x] 학생 목록 고밀도 데이터 테이블 및 카드 뷰 전환

- [x] **4.2 학생 상세 페이지 셸 및 프로필 헤더 (`/students/[id]`)**
  - [x] 상단 학생 요약 바: 학번, 한/영 이름, 학년, 생년월일, 입학일, 전출 배지(Withdrawal 시 Rose 컬러)
  - [x] 4개 탭 네비게이션: 종합 대시보드, GPA 상세/성적표, 1:1 진학상담, 목표 대학교

- [x] **4.3 탭 1: 종합 대시보드 (High-Density Bento Grid)**
  - [x] Card 1: 전체 Cumulative Unweighted GPA 카드 (32px Bold, 4.00 만점 프로그레스)
  - [x] Card 2: 5대 핵심 Core GPA 카드 (Core 이수율 배지)
  - [x] Card 3: 총 이수 학점 (Cumulative Credits) 및 졸업 요건(24.0 학점) 잔여량 위젯
  - [x] Card 4: 공인 시험 성적 위젯 (College Board 공식 전체 AP 과목군 39종 연동, 리스트 외 수동 직접 입력 토글 기능 탑재, 관리자/상담사 전용 삭제 연동 `AddTestModal`)
  - [x] Card 5: 비교과 활동 위젯 (동아리 즉시 추가 `AddClubModal`, 수상내역 즉시 추가 `AddAwardModal` 및 관리자/상담사 전용 삭제 연동)

- [x] **4.4 탭 2: GPA 상세 분석 및 시각화 (Charts & Transcript)**
  - [x] 차트 A: 학기별 전체 GPA vs 5대 핵심 Core GPA 추이 비교 꺾은선 그래프 (Recharts)
  - [x] 차트 B: 5대 핵심 교과별 성적 상승/하락 멀티 라인 차트 및 증감 배지(▲/▼)
  - [x] 학년/학기/과목분류별 필터가 포함된 Transcript 상세 성적표 테이블
  - [x] 과목별 [수정 ✎] 버튼 클릭 시 Credit Make-up 모달 트리거 (Viewer에게는 비활성화)

---

## Phase 5: 1:1 진학상담 기록 및 목표 대학교 워크스페이스

- [x] **5.1 탭 3: 1:1 진학상담 기록 (Counseling Logs)**
  - [x] 좌측: 새 상담 일지 작성 폼 (상담 일시, 카테고리, 학부모 동석 여부, 제목, 상세 내용 Markdown, Action Items 체크리스트 추가)
  - [x] 우측: 상담 타임라인 히스토리 뷰 (최신순 정렬, 검색 및 카테고리 필터링)
  - [x] Action Items 실시간 체크 토글 및 저장 API
  - [x] 상담 일지 작성/수정/삭제 Server Actions 및 권한 가드(Viewer 차단)

- [x] **5.2 탭 4: 목표 대학교 비교 워크스페이스 (Target Universities)**
  - [x] 2단 비교 뷰(Side-by-Side): [교사 제안 대학] vs [학생 희망 대학] 칸반 보드 레이아웃
  - [x] 전형 구분 배지 매핑: ED (Purple), EA (Sky), Regular (Slate)
  - [x] 판정 결과 배지 매핑: Reach (Rose), Match (Blue), Safety (Emerald)
  - [x] 대학별 세부 카드: 대학명, 전공, Pros(장점), Cons(단점), 교사 전문 코멘트(Notes), 결과 상태
  - [x] 신규 대학 추가 및 수정 모달 (Viewer는 열람 전용)

- [x] **5.3 1:1 상담 일정 및 긴급 상담 큐 대시보드 개편 & 카드형 목록 분리**
  - [x] `CounselingLog` 스키마 확장: `status`(기본값 "SCHEDULED" 상담 전/미진행), `isUrgent`(긴급 여부), `nextCounselDate`(다음 상담 일정) 필드 추가 및 DB 동기화
  - [x] 학생 상세 페이지: 새 상담일지 작성 폼에 '상담 진행 상태(Default: 상담 전/미진행)', 할 일 아래 '다음 상담일정' 및 '🚨 긴급' 설정 기능 구현
  - [x] 학생 상세 타임라인: 진행 상태 배지(🟡 상담 전 vs 🟢 상담 완료), 🚨 긴급 배지, 📅 다음 상담일정 안내 및 원클릭 완료 전환 액션 연동
  - [x] 사이드바 메뉴 개편: `학생 목록 (전체)` 바로 아래 `학생 목록 (카드형)` (`/students/cards`) 메뉴 신설 및 기존 카드 덱 이동
  - [x] 메인 대시보드(`/dashboard`) 개편: 최상단 **[🚨 긴급 상담 리스트 (Urgent Counseling Queue)]** 및 **[📅 상담 일정 & 전체 1:1 상담 목록]** 최우선 배치, 검색/필터/상태 즉시 토글 API 연동 완료

---

## Phase 6: Supabase(PostgreSQL) 마이그레이션 가이드 및 최종 검증

- [x] **6.1 데이터베이스 프로바이더 전환 스크립트 작성**
  - [x] `.env.example` 및 환경변수 템플릿 정리 (`DATABASE_URL`, `DIRECT_URL`)
  - [x] PostgreSQL 마이그레이션 자동화 스크립트 또는 가이드 작성 (`MIGRATION_SUPABASE.md`, `scripts/migrate-to-supabase.ts`)
  - [x] SQLite 데이터를 PostgreSQL로 이관/초기화하는 시드 연동 가이드

- [x] **6.2 전체 시스템 통합 테스트 및 E2E 시나리오 검증**
  - [x] 시나리오 1: `ls.counselors@gmail.com` 로그인 -> `1234` 입력 -> 비밀번호 강제 변경 팝업 -> 변경 완료 후 대시보드 진입
  - [x] 시나리오 2: `kyumun.hwang@gmail.com` 로그인 -> 교사 관리 페이지 진입 -> 신규 교사 생성 및 비밀번호 리셋
  - [x] 시나리오 3: Gradelink 성적표 샘플 PDF 업로드 -> Gemini API 파싱 -> 5대 교과 자동 매핑 -> Unweighted GPA 산출 결과 정합성 검증
  - [x] 시나리오 4: 특정 과목 Credit Make-up 수정 -> Audit Log 생성 및 학기/누적 GPA 즉시 재계산 반영 검증
  - [x] 시나리오 5: Viewer 계정 로그인 시 `/teachers` 접근 차단(403) 및 모든 수정 버튼 비활성화 검증
