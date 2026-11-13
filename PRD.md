# PRD: 등대교육공동체(LIS) 진학상담포탈 (College Counseling Portal)

## 1. Project Overview

### 1.1 프로젝트 배경 및 목적
* **프로젝트명:** 등대교육공동체 진학상담포탈 (LIS College Counseling Portal)
* **목적:** 등대글로벌스쿨(Lighthouse International School, CEEB: 682019) 진학상담교사가 고등학생(9~12학년)과 1:1 대학 진학 상담을 진행할 때, 학생의 기본 인적사항, 학기별 GPA(전체 및 5대 주요교과), 공인어학/표준화 시험 점수(TOEFL, SAT/PSAT, AP), 동아리(Clubs) 및 수상내역(Awards), 1:1 상담 일지, 목표 대학 리스트를 한눈에 파악하고 통합 관리하기 위한 **순수 교사 전용(Teacher-Only) 웹 애플리케이션**이다.
* **핵심 가치:**
  1. **Gradelink Transcript PDF 자동 파싱:** 매 학기 생성되는 Gradelink 성적표 PDF(단일 및 다중 파일 일괄 업로드)를 Gemini API(Vision/Document)로 100% 정확하게 구조화된 JSON으로 추출하여 DB화한다.
  2. **Unweighted GPA & 5대 핵심 교과 분석:** 4.0 만점 기준의 Unweighted GPA만 산출하며, 전체 누적 GPA와 5대 주요교과(English, Math, Science, Social Studies/History, Foreign Language/Chinese) Core GPA를 분리 산출하고 학기별 성적 상승/하락 추이를 시각화한다.
  3. **유연한 성적 보정(Credit Make-up):** 재수강(Credit Recovery) 또는 학점 보충(Make-up) 발생 시 수동으로 교과 점수를 수정/추가하여 GPA에 즉시 반영(Credit Make-up 반영)할 수 있다.
  4. **역할 기반 접근 제어(RBAC) 및 로컬 우선 DB 설계:** 관리자(Admin), 진학상담교사(Counselor), 일반교사(Viewer) 3단계 권한을 지원하며, 1차 개발은 로컬 DB(SQLite + Prisma/Drizzle)로 즉시 구동 가능하게 구축하되 추후 Supabase(PostgreSQL)로 무중단 마이그레이션이 가능한 스키마로 설계한다.

### 1.2 사용자 역할 및 계정 정책 (User Roles & Auth)
본 시스템은 학생에게 화면을 공유하지 않는 **순수 교사 전용 시스템**이며, 지정된 이메일과 비밀번호로 로그인한다.

| 역할 (Role) | 권한 설명 | 초기 시드 계정 (Seed Account) |
| :--- | :--- | :--- |
| **관리자 (Admin)** | 전체 시스템 관리, 모든 학생 데이터 조회/수정/삭제, Transcript 업로드, **교사 계정 관리(추가/비밀번호 변경/삭제)** | **ID:** `kyumun.hwang@gmail.com`<br>**PW:** `emeo1004#` |
| **진학상담교사 (Counselor)** | 주 사용자. 모든 학생 데이터 조회/생성/수정/삭제, Transcript PDF 일괄 업로드 및 성적 수정(Credit Make-up), 상담 기록 및 대학 리스트 작성, **교사 계정 관리(추가/비밀번호 변경/삭제)** | **ID:** `ls.counselors@gmail.com`<br>**PW:** `1234` *(최초 로그인 시 비밀번호 강제 변경 플로우 필수)* |
| **일반교사 (Viewer)** | 모든 학생의 대시보드, GPA 상세 분석, 상담 기록, 목표 대학 리스트 **열람(Read-Only)만 가능**. 데이터 수정/업로드 불가, **'교사 관리' 메뉴 접근 및 노출 완전 차단**. | 관리자 또는 진학상담교사가 교사 관리 페이지에서 생성 |

---

## 2. Core User Flows & Functional Requirements

### 2.1 로그인 및 계정 관리 플로우 (Authentication & User Management)
1. **로그인:** 이메일/비밀번호 기반 로그인. 다중 사용자 동시 접속 지원(JWT/Session 기반).
2. **초기 비밀번호 강제 변경 (`mustChangePassword`):**
   * `ls.counselors@gmail.com` (초기 비밀번호 `1234`) 계정으로 최초 로그인 시, 다른 페이지로 이동하기 전에 **비밀번호 변경 모달/페이지**를 강제로 띄워 새 비밀번호로 변경 후 시스템을 사용하도록 한다.
3. **교사 관리 페이지 (`/teachers` - Admin, Counselor 전용):**
   * **권한 제한:** 네비게이션 바 및 라우트 가드에서 `Viewer(일반교사)`에게는 아예 메뉴가 보이지 않으며 URL 직접 접근 시 403 리다이렉트 처리.
   * **기능:** 교사 목록 조회(이름, 이메일, 역할, 생성일, 비밀번호 변경 여부), 신규 교사 추가(이름, 이메일, 초기 비밀번호, 역할[Admin/Counselor/Viewer] 지정), 기존 교사 비밀번호 초기화/변경, 교사 계정 삭제.

### 2.2 학생 목록 및 통합 대시보드 (`/dashboard`, `/students/[id]`)
1. **좌측/상단 학생 선택기 및 검색 필터:**
   * 학번(예: `1017`, `1119`), 영문/한글 이름(예: `Gaeun LIM`, `SEUNGJOO 백승주 BACK`), 현재 학년(Grade 9~12), 재학 상태(재학/졸업/전출 `Withdrawal`)별 검색 및 필터링.
2. **학생 기본 정보 카드 (Student Profile Header):**
   * 학번(Student ID, 파일명 앞 4자리에서 추출), 이름(영문/한글), 생년월일(Birth Date), 성별(Gender), 입학일(Entry Date), 졸업(예정)일(Graduation Date), 전출일(Withdrawal Date - 값이 있을 경우 '전출' 배지 표시), 학부모 성명(Parent/Guardian), 연락처 및 주소 표시.
3. **GPA 요약 위젯 (GPA Summary Widget):**
   * **Cumulative Unweighted GPA (전체 누적 GPA):** 4.00 만점 기준 소수점 셋째 자리까지 표시 (예: `3.956`).
   * **Core Cumulative GPA (5대 주요교과 누적 GPA):** 5대 핵심 교과(English, Math, Science, Social Studies/History, Foreign Language/Chinese)만 별도 분리하여 4.00 만점 기준으로 산출 및 표시.
   * **총 이수 학점 (Cumulative Credits):** 예: `24.000 Credits`.
4. **공인성적 요약 및 입력 위젯 (Standardized Tests - 최종 대표 점수 위주):**
   * 복잡한 회차별 관리 대신 **최종 대표 점수(Best/Representative Score)**를 직관적으로 기록 및 즉시 수정(Admin/Counselor)할 수 있는 카드 UI.
   * **TOEFL:** 총점 (0~120) 및 응시년월 메모 (선택적으로 R/L/S/W 간단 메모).
   * **SAT / PSAT:** 구분(SAT 또는 PSAT), 총점(400~1600), Evidence-Based Reading & Writing, Math 점수.
   * **AP (Advanced Placement):** 과목명(예: AP Calculus AB, AP Biology, AP Psychology 등), 점수(1~5점), 응시년도 리스트 추가/삭제.
5. **비교과 활동 위젯 (Extracurriculars - Clubs & Awards):**
   * **학생 클럽 리스트 (Student Clubs):** 클럽명, 활동 학년(예: 9, 10, 11, 12), 역할/직책(예: President, Member), 활동 내용 요약 추가/수정/삭제.
   * **교내외 상장 리스트 (Awards & Honors):** 수상명, 구분(교내 Internal / 교외 External), 수상 학년/일자, 수여 기관 추가/수정/삭제.

### 2.3 GPA 상세 분석 및 Transcript PDF 일괄 처리 (`/gpa-analytics` & `/students/[id]/gpa`)
1. **Gradelink Transcript PDF 업로드 (단일 및 다중 파일 일괄 업로드):**
   * **Batch Upload 지원:** 매 학기 말 전교생(9~12학년) 또는 특정 학년(예: 2022-2023 Semester 1 9학년 전체)의 PDF 파일 수십~수백 개를 드래그 앤 드롭으로 한 번에 업로드하여 순차/병렬 비동기 파싱 처리.
   * **파일명 및 헤더 자동 매칭:** 파일명 규칙(`{학번} - {성, 이름}.pdf`, 예: `1017 - LIM, Gaeun.pdf`, `1121 - BACK, SEUNGJOO.pdf`)과 PDF 내부 헤더(`Name`, `Birth Date`, `Entry Date`, `Withdrawal Date`, `Graduation Date`)를 읽어 기존 학생 DB와 매칭하거나 신규 학생 레코드를 자동 생성/업데이트.
   * **Gemini API 기반 고정밀 파싱:** Gradelink 특유의 2단 컬럼 레이아웃, 줄바꿈 밀림 현상, 외부 학점 표기(`(APEX)`, `(UC Scout)`), 계절학기(`Summer Semester 2025`, `Winter Semester 2023` 등), 전출생의 미이수 표기(`nm`, `N/A`, `0.000`) 등을 정확하게 파싱하여 JSON으로 변환 후 검증 화면(Preview) 또는 즉시 DB 반영.
2. **교과 자동 분류 (5대 핵심 교과 vs 기타 교과):**
   * PDF에서 추출된 `Class Title`을 기반으로 아래 **5대 핵심 교과(Core Subjects)**와 **기타 교과(Other/Electives)**로 자동 매핑(수동 카테고리 변경도 허용):
     1. **English:** `English I`, `Honors English I`, `English II`, `English II Honors`, `English III`, `English IV`, `English IV-B`, `Great Books`, `Korean Great Books`, `Creative Writing`, `Senior Creative Writing`, `Reading Skills & Strategies` 등
     2. **Math:** `Geometry`, `Algebra II`, `Algebra II (Credit Recovery)`, `AP Precalculus`, `AP Calculus AB`, `Probability & Statistics`, `Math of Personal Finance` 등
     3. **Science:** `Biology`, `AP Biology`, `Chemistry`, `AP Chemistry`, `Physics`, `AP Physics I` 등
     4. **Social Studies / History:** `Korean History`, `Modern World History`, `US History`, `AP US History`, `AP Psychology` 등
     5. **Foreign Language (Chinese):** `Chinese I`, `Chinese II`, `Chinese III` 등
     * **Other (기타 교과 - 전체 GPA에는 포함하되 5대 주요교과 추이 그래프 및 Core GPA에서는 제외):** `Bible I~IV`, `Freshmen/Sophomore/Junior/Senior Seminar`, `Physical Education`, `Music`, `Drawing and Painting`, `Color and Design`, `Perspective`, `Desktop Publishing`, `Computer Science`, `Yearbook` 등
3. **Unweighted GPA(4.0 만점) 산출 및 Credit Make-up 반영 로직:**
   * **Unweighted 4.0 Scale 고정:** 모든 과목(AP, Honors 포함)은 가중치 없이 **4.0 만점 기준(Unweighted)**으로만 표기 및 계산한다.
     * 표준 환산 기준(Gradelink Unweighted 기준 기본값 제공 및 설정 가능): `A+ (4.0)`, `A (4.0 또는 학기 역산 기준값)`, `A- (3.7)`, `B+ (3.3)`, `B (3.0)`, `B- (2.7)`, `C+ (2.3)`, `C (2.0)`, `C- (1.7)`, `D+ (1.3)`, `D (1.0)`, `D- (0.7)`, `F (0.0)`. (※ PDF에 적힌 학기별 GPA 및 누적 GPA 원본 값도 함께 저장하여 오차 검증 지원)
   * **Credit Make-up 반영 및 수동 편집 기능:**
     * 교사가 특정 학기의 과목 성적을 수동으로 추가/수정하거나 **Credit Make-up(재수강/학점 보충, 예: `Algebra II (Credit Recovery)`)** 처리를 할 수 있다.
     * 특정 과목에 대해 `Credit Make-up`을 적용하면, **보충/재수강한 성적이 해당 과목의 성적으로 반영되어 학기별 GPA, 전체 누적 GPA, 5대 주요교과(Core) GPA가 즉시 자동 재계산**된다(원본 성적 이력은 참고용 로그로 보존 가능).
4. **시각화 차트 (GPA & Subject Trend Charts):**
   * **학기별 GPA 추이 차트:** 9학년 1학기부터 12학년 2학기(계절학기 포함)까지의 **전체 GPA**와 **5대 주요교과(Core) GPA** 추이 비교 꺾은선 그래프.
   * **5대 핵심 교과별 성적 상승/하락 경향 차트:** `English`, `Math`, `Science`, `Social Studies/History`, `Foreign Language(Chinese)` 5개 교과의 학기별 평점(0.0~4.0) 변화를 라인 차트 및 증감 배지(▲ 상승 / ▼ 하락 / - 유지)로 시각화.

### 2.4 1:1 진학상담 기록 탭 (`/students/[id]?tab=counseling`)
1. **상담 일지 작성 및 타임라인 조회:**
   * 상담 일자, 상담 교사명(자동 입력), 상담 주제/구분(정기상담, 학업/GPA 관리, 공인성적 점검, 대학 리스트 선정, 에세이/원서 점검 등), 상세 상담 내용(Rich Text 또는 마크다운), 향후 Action Item(할 일) 기록.
   * **교사 전용 내부 메모:** 본 포탈은 학생에게 보여주지 않는 순수 교사 전용 시스템이므로, 교사의 솔직한 평가 및 민감한 상담 내용을 제약 없이 기록하고 시간순(최신순)으로 열람/검색/수정/삭제할 수 있다.

### 2.5 목표 대학교 리스트 및 비교 분석 탭 (`/students/[id]?tab=universities`)
1. **교사 제안 대학 vs 학생 희망 대학 관리:**
   * **구분(Proposer Type):** `교사 제안 (Teacher Recommended)` vs `학생 희망 (Student Desired)` (또는 양측 모두 동의 `Mutual`).
   * **지원 전형 태그 (Application Type):** `ED (Early Decision)`, `EA (Early Action)`, `REA (Restrictive Early Action)`, `Regular (Regular Decision)`, `Rolling` 등 선택.
   * **판정 카테고리 태그 (Admission Chance Tier):** `Reach (상향)`, `Match (적정)`, `Safety (안정)` 색상 배지 표시.
   * **상세 기록 항목:** 대학교명(국가/지역), 희망 전공(Intended Major), **학교의 장점(Pros)**, **학교의 단점(Cons)**, **진학상담 메모 및 특이사항(Notes - 장학금, 포트폴리오 요건, 추천서 필요 여부 등)**, 최종 지원 결과 상태(검토중/지원완료/합격/불합격/대기).

---

## 3. UI/UX Design Specification (Stitch `DESIGN.md` 연동 가이드)
* **레이아웃 구조:**
  * 좌측 고정 사이드바(Dashboard, 학생 목록, GPA 상세/Transcript 일괄 업로드, 진학상담 기록, 목표 대학 관리, [Admin/Counselor 전용] 교사 관리) + 상단 헤더(현재 로그인한 교사 이름/역할 배지, 학생 빠른 검색창, 로그아웃) + 메인 콘텐츠 영역.
* **학생 상세 페이지 탭 구성 (`/students/[id]`):**
  * `Tab 1: 종합 대시보드 (Overview)` - 인적사항, 전체/Core GPA 요약, 공인성적(TOEFL/SAT/AP), 클럽 및 수상내역, 최근 상담 요약, 목표 대학 요약.
  * `Tab 2: GPA 상세 및 성적 분석 (GPA & Transcript)` - 5대 핵심 교과 상승/하락 추이 그래프, 학기별 성적표 테이블, Credit Make-up 수동 수정/추가 모달, 원본 PDF 뷰어/업로드.
  * `Tab 3: 1:1 진학상담 기록 (Counseling Logs)` - 상담 기록 작성 폼 및 타임라인 히스토리.
  * `Tab 4: 목표 대학교 리스트 (Target Universities)` - 교사 제안 vs 학생 희망 대학 비교 보드(ED/EA/Regular, Reach/Match/Safety 필터 및 장단점/메모 카드).

---

## 4. Technical Stack & Database Migration Strategy
* **Frontend & Fullstack Framework:** Next.js (App Router, TypeScript), Tailwind CSS, Lucide Icons, Recharts (성적 추이 시각화).
* **Database & ORM (2단계 전략):**
  * **Phase 1 (로컬 개발 및 즉시 검증):** SQLite + Prisma ORM (또는 Drizzle ORM). 별도의 클라우드 DB 설정 없이 로컬에서 즉시 마이그레이션 및 시드 데이터(`kyumun.hwang@gmail.com`, `ls.counselors@gmail.com`) 생성 가능.
  * **Phase 2 (프로덕션 배포):** Supabase (PostgreSQL + Supabase Storage). Prisma/Drizzle의 provider만 `postgresql`로 변경하여 스키마 수정 없이 100% 호환 마이그레이션.
* **AI PDF Parser:** Google Gemini API (`@google/genai`, `gemini-2.5-flash` 또는 `gemini-2.5-pro`)의 Multimodal Document Understanding 및 Structured Outputs(`responseSchema`)를 사용하여 Gradelink PDF를 정형 JSON으로 추출.