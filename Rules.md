# 등대교육공동체 진학상담포탈 에이전트 개발 및 보안 규칙 (Rules.md)

이 문서는 Antigravity AI 개발 에이전트가 본 프로젝트의 코드를 작성, 리팩토링, 배포할 때 반드시 준수해야 하는 **절대적 보안 및 엔지니어링 규칙**입니다.

---

## 1. 역할 기반 접근 제어 및 보안 규칙 (RBAC & Security)

### 1.1 백엔드 권한 검증 필수 원칙 (Zero-Trust Guard)
* 프론트엔드의 버튼 숨김이나 비활성화(`disabled`)에 절대 의존하지 않는다.
* **모든 Server Action과 API Route (`/api/*`)의 진입점 최상단**에서 현재 세션의 사용자 식별자 및 Role을 반드시 검증해야 한다.
  ```typescript
  // 필수 패턴 예시
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED: Authentication required');
  }
  ```

### 1.2 `Viewer` (일반교사) 권한 제약 엄수
* **쓰기 제한:** `Viewer` 역할의 사용자가 시도하는 모든 변경 요청(`POST`, `PUT`, `PATCH`, `DELETE`)은 즉시 HTTP 403 Forbidden 에러를 반환해야 한다.
* **라우트 차단:** `/teachers` 및 `/api/teachers` 경로는 `Viewer`에게 절대 노출되지 않으며, 직접 URL 호출 시 미들웨어 및 라우트 핸들러에서 차단되어야 한다.
* **열람 범위:** `Viewer`는 학생 목록, 상세 대시보드, GPA 차트, 성적표, 목표 대학 리스트의 읽기(`GET`)만 가능하다.

### 1.3 초기 비밀번호 강제 변경 플로우 보장
* `ls.counselors@gmail.com` 등 초기 비밀번호가 발급된 계정은 `mustChangePassword === true`로 설정된다.
* 미들웨어와 모든 페이지 레이아웃에서 이 플래그를 감지하여, 비밀번호를 변경하기 전까지는 어떠한 업무 화면(학생 대시보드, 성적표 등)에도 접근하지 못하도록 격리한다.

---

## 2. GPA 산출 및 비즈니스 로직 일관성 규칙 (GPA Integrity)

### 2.1 단일 진실 공급원(Single Source of Truth) 원칙
* GPA 계산 수식(4.0 만점 Unweighted 환산, 5대 교과 필터링, 학점 가중치 곱합)을 여러 컴포넌트나 API에 분산 작성하는 것을 **엄격히 금지**한다.
* 반드시 `src/lib/gpa/calculator.ts`의 표준 유틸리티 함수(`calculateUnweightedGPA`, `recalculateStudentGPAs`)만을 호출하여 산출해야 한다.

### 2.2 실시간 재계산 트리거 동기화
* 다음 상황이 발생할 때마다 동일한 재계산 유틸리티를 호출하여 `Student` 및 `SemesterRecord` 테이블의 GPA 값을 즉시 갱신하고 트랜잭션으로 저장해야 한다:
  1. Gradelink Transcript PDF 업로드 및 파싱 완료 시점
  2. 교사가 과목 성적을 수동으로 추가/수정하는 시점
  3. `Credit Make-up` (재수강/학점 보충) 승인 및 취소 시점
  4. 과목의 교과 카테고리(예: OTHER -> ENGLISH)를 수동 변경하는 시점

### 2.3 5대 핵심 교과 분류 경계 준수
* 5대 교과(`ENGLISH`, `MATH`, `SCIENCE`, `SOCIAL_STUDIES`, `FOREIGN_LANGUAGE`)와 `OTHER`의 경계를 명확히 유지한다.
* `OTHER` 과목은 학점 취득 및 전체 누적 GPA에는 포함되나, **5대 핵심 Core GPA 산출식과 추이 그래프에서는 100% 배제**되어야 한다.

---

## 3. 데이터베이스 호환성 및 ORM 규칙 (Database & ORM)

### 3.1 SQLite ↔ Supabase PostgreSQL 무중단 마이그레이션 보장
* 1차 개발은 로컬 SQLite(`file:./dev.db`)를 사용하지만, 추후 Supabase PostgreSQL로의 원클릭 이전을 위해 **SQLite 전용 비표준 SQL 문법 사용을 전면 금지**한다.
* `prisma.$queryRaw`나 원시 쿼리(Raw SQL)는 원칙적으로 금지하며, 반드시 **Prisma Client의 표준 Type-safe API**만을 사용한다.
* JSON 필드를 다룰 때는 SQLite에서는 문자열로 저장되고 PostgreSQL에서는 `Json` 타입으로 매핑되므로, 읽기/쓰기 시 직렬화(Serialization)/역직렬화(Deserialization) 유틸리티 함수를 일관되게 적용한다.

### 3.2 트랜잭션 보장
* 학생 인적사항 생성 및 다수 학기/과목 일괄 저장(PDF 파싱), 성적 수정과 이력(Audit Log) 생성은 반드시 `prisma.$transaction` 블록 내에서 원자적으로 처리되어야 한다.

---

## 4. 코드 품질, 포맷팅 및 에이전트 행동 규칙 (Coding Standards)

### 4.1 플레이스홀더 및 축약 금지 (No Placeholders)
* 코드 작성 시 `// TODO: 여기에 코드를 작성하세요`, `...`, `/* 생략 */` 등의 불완전한 코드를 반환하는 것을 엄격히 금지한다.
* 항상 즉시 실행 가능하고 타입 오류가 없는 100% 완성된 소스 코드를 작성한다.

### 4.2 모듈화 및 레이어 분리 (Modularity)
* 단일 파일에 비즈니스 로직, UI, DB 쿼리를 혼합하지 않는다:
  * `src/lib/gemini/`: Gemini API 연동 및 PDF 파싱 파이프라인
  * `src/lib/gpa/`: 5대 교과 분류기 및 GPA 계산 엔진
  * `src/lib/auth/`: 인증, 세션, RBAC 가드
  * `src/components/`: 재사용 가능한 UI 컴포넌트 (Bento Cards, Modals, Tables)
  * `src/app/`: Next.js App Router 라우트 및 페이지

### 4.3 개발 서버 포트 관리 규칙 (Dev Server & Port Management)
* 기본 포트 `3000`은 절대 사용하지 않는다.
* 본 프로젝트는 고유 포트 **`3005`**를 할당하여 사용한다 (`package.json`의 스크립트에 `next dev -p 3005` 명시).
* 개발 서버 실행 전 해당 포트 점유 여부를 확인하고 충돌 시 자율적으로 관리한다.

### 4.4 문서화 동기화 규칙 (Continuous Documentation)
* 각 Task 및 Phase 작업이 완료될 때마다:
  1. `tasks.md`의 해당 체크박스를 `[x]`로 즉시 갱신한다.
  2. `Memory.md`의 하단에 작업 일시, 요약, 변경 파일, 해결된 이슈를 기록한다.
  3. 요구사항 변경이나 아키텍처 결정이 발생하면 `Architecture.md`와 `Memory.md`에 즉시 반영한다.
