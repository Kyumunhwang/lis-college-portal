# 등대글로벌스쿨 진학상담포털 (LIS College Portal)

> **CEEB Code: 682019** | 등대글로벌스쿨 교직원 전용 대학 진학상담 및 학생 학적/GPA 통합 관리 시스템

---

## 🚀 빠른 시작 가이드 (자택 및 신규 개발 환경)

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성합니다.
```bash
cp .env.example .env
```
내용 확인:
```env
DATABASE_URL="file:./dev.db?connection_limit=1&timeout=60000"
JWT_SECRET="lis-counseling-portal-super-secret-key-2024"
GEMINI_API_KEY=""
PORT=3005
```

### 3. 데이터베이스 초기화 및 시드 데이터 적재
```bash
# Prisma 클라이언트 생성 및 DB 스키마 푸시
npx prisma generate
npm run db:push

# 샘플 학생 및 교직원 계정 데이터 시드
npm run db:seed
```

### 4. 로컬 개발 서버 실행
```bash
npm run dev:portal
```
- 브라우저 접속: `http://localhost:3005` (또는 `http://localhost:3005/dashboard`)
- 기본 관리자 계정:
  - **이메일**: `kyumun.hwang@gmail.com`
  - **비밀번호**: `emeo1004#`

---

## 🛠 주요 기술 스택 및 아키텍처

- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS, Lucide React
- **Database & ORM**: SQLite (Prisma ORM) / Supabase PostgreSQL 마이그레이션 호환
- **Authentication**: JWT HttpOnly Cookie 기반 세션 인증 및 RBAC (Admin, Counselor, Viewer)
- **Visualization**: Recharts (GPA 추이 및 성적 통계 차트)
- **Mobile Support**: PWA Web App Manifest 및 홈 화면 추가 아이콘 지원

---

## 📂 프로젝트 주요 디렉터리 구조

```
├── public/                 # 학교 로고, 웹 매니페스트(PWA), 파비콘
├── prisma/
│   ├── schema.prisma       # 학생, 학기, 코스성적, 상담일지, 공인시험, 대학목록 스키마
│   └── seed.ts             # 기본 관리자/상담교사 계정 및 샘플 학생 데이터
├── src/
│   ├── app/                # Next.js App Router (페이지 및 API 엔드포인트)
│   │   ├── dashboard/      # 메인 1:1 진학상담 대시보드 및 긴급 상담 큐
│   │   ├── students/       # 학생 목록 (전체 테이블형 및 카드형 워크스페이스)
│   │   ├── graduates/      # 졸업생 전용 아카이브 및 GPA 관리
│   │   ├── gpa-analytics/  # 성적표 PDF 분석 및 일괄 파싱
│   │   ├── teachers/       # 교직원 계정 및 권한 관리 (Admin/Counselor)
│   │   └── api/            # REST API 백엔드 라우트 핸들러
│   ├── components/         # 모달, 차트, 사이드바, 헤더 컴포넌트
│   └── lib/                # 비즈니스 로직, 인증, 학년 자동진급 엔진, 유틸리티
│       ├── academic/       # 학년도/학기 계산 (US Curriculum) 및 자동 진급 엔진
│       ├── auth/           # JWT 세션 및 RBAC 권한 검증
│       └── prisma.ts       # Prisma Client 싱글톤
└── scripts/                # 데이터 마이그레이션 및 일괄 처리 스크립트
```

---

## 🔒 보안 및 개인정보 보호 안내
- 본 저장소는 학생 성적표 원본 PDF 및 개인정보 파일(`Transcript/`, `dev.db`)이 `.gitignore` 처리되어 있어 안전하게 버전 관리됩니다.
- 신규 환경에서 작업 시 `npm run db:seed`를 실행하여 가상의 테스트 데이터로 안심하고 개발을 진행할 수 있습니다.
