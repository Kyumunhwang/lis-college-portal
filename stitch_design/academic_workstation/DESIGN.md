---
name: Academic Workstation
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444651'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#00285e'
  on-tertiary: '#ffffff'
  tertiary-container: '#003d88'
  on-tertiary-container: '#82abff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  brand-navy-900: '#0F172A'
  brand-navy-800: '#1E3A8A'
  brand-navy-700: '#1D4ED8'
  brand-navy-100: '#DBEAFE'
  brand-navy-50: '#EFF6FF'
  bg-canvas: '#F8FAFC'
  surface-card: '#FFFFFF'
  surface-elevated: '#F1F5F9'
  border-subdued: '#E2E8F0'
  border-strong: '#CBD5E1'
  text-primary: '#0F172A'
  text-secondary: '#475569'
  text-muted: '#94A3B8'
  safety-base: '#10B981'
  safety-bg: '#ECFDF5'
  safety-text: '#065F46'
  match-base: '#3B82F6'
  match-bg: '#EFF6FF'
  match-text: '#1E40AF'
  warning-base: '#F59E0B'
  warning-bg: '#FFFBEB'
  warning-text: '#92400E'
  reach-base: '#F43F5E'
  reach-bg: '#FFF1F2'
  reach-text: '#9F1239'
typography:
  kpi-metric:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-h2:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  subheading-h3:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
  body-primary:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-primary-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-compact:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  code-cell:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  badge-label:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-dense: 0.75rem
  margin: 1.5rem
  margin-compact: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

# 등대글로벌스쿨(LIS) 대학 진학상담포탈 UI/UX 디자인 시스템 & 화면 구조 명세 (DESIGN.md)

---

## 1. 프로젝트 개요 및 디자인 철학

### 1.1 프로젝트 목적
**등대글로벌스쿨(Lighthouse International School) 대학 진학상담포탈(College Counseling Portal)**은 고등학교 진학상담교사 및 관리자가 학생별 학업 성취도(GPA, 표준화 시험), 비교과 활동, 상담 이력, 목표 대학 로드맵을 통합 분석하고 체계적으로 상담을 진행하기 위한 **100% 교사 전용 엔터프라이즈 B2B SaaS**입니다. 학생에게 화면을 직접 공유하지 않는 순수 교사용 전문 워크스테이션 환경을 지향합니다.

### 1.2 타겟 사용자 정의 및 권한 체계 (RBAC)
*   **Admin (학교 관리자/진학부장):** 전체 시스템 설정, 교사 계정 생성/수정/삭제/비밀번호 리셋, 성적 일괄 PDF 업로드/파싱/수정, 전체 상담 기록 및 목표 대학 열람 및 수정.
*   **Counselor (진학상담교사):** 학생 대시보드 열람, 성적(GPA/공인시험) 수동 편집 및 Credit Make-up 승인, 1:1 상담 기록 작성 및 Action Item 관리, 목표 대학 리스트(Reach/Match/Safety) 제안 및 수정, 교사 목록 열람/추가.
*   **Viewer (일반 교사 / 교과 교사):** 학생 정보 및 성적 데이터 열람 전용. 상담 기록 열람 제한(또는 기본 요약만 열람), 교사 관리 메뉴 미노출(Hidden), 성적 수정/PDF 업로드 불가.

### 1.3 핵심 디자인 원칙
1.  **High-density Bento Grid (고밀도 정보 구조):**
    진학상담 중 모니터 1개 화면 내에서 학생의 학적, 4.0 만점 기준 GPA, 시험 점수, 비교과 및 성적 추이 라인 차트를 스크롤을 최소화하여 한눈에 파악할 수 있는 고밀도 Bento Box 레이아웃을 적용합니다.
2.  **Modern Academic & Data-Driven Aesthetics:**
    전통적인 명문 아카데믹 아이덴티티를 계승하는 Deep Navy Blue를 메인으로 하고, 눈의 피로를 낮추는 Slate 계열 뉴트럴 톤과 데이터 상태를 명확히 구별하는 시맨틱 컬러(Emerald, Amber, Rose, Sky)를 조합합니다.
3.  **Strict Action Verification (안전성 및 변경 이력):**
    성적 수정(Credit Make-up), 비밀번호 강제 변경, 계정 삭제 등 민감 작업은 반드시 모달 컨펌 및 변경 이력(Audit Trail Badge)을 남겨 데이터 신뢰성을 보장합니다.

---

## 2. 디자인 토큰 및 스타일 가이드

### 2.1 Color Palette

#### Primary & Brand Colors (Academic Navy)
*   **Brand Primary (Navy-900):** `#0F172A` (Sidebar Background, Heavy Headers)
*   **Brand Deep (Navy-800):** `#1E3A8A` (Primary Key UI, Active Nav, Buttons)
*   **Brand Medium (Navy-700):** `#1D4ED8` (Button Hover, Interactive Focus)
*   **Brand Soft (Navy-100):** `#DBEAFE` (Active Selection Tint, Badge Background)
*   **Brand Light (Navy-50):** `#EFF6FF` (Table Row Highlight, Focused Container)

#### Neutral & Background Colors (Slate & Surface)
*   **Background Canvas:** `#F8FAFC` (Slate-50, 앱 전체 기본 배경)
*   **Surface Card (White):** `#FFFFFF` (Bento 카드, 모달, 패널 표면)
*   **Surface Elevated:** `#F1F5F9` (Slate-100, 테이블 헤더, 인풋 배경, 비활성 탭)
*   **Border Subdued:** `#E2E8F0` (Slate-200, 카드 및 테이블 외곽선)
*   **Border Strong:** `#CBD5E1` (Slate-300, 폼 컨트롤 테두리, 구분선)
*   **Text Primary:** `#0F172A` (Slate-900, 본문 메인, 헤딩)
*   **Text Secondary:** `#475569` (Slate-600, 라벨, 설명글, 서브 헤더)
*   **Text Muted:** `#94A3B8` (Slate-400, 플레이스홀더, 비활성 아이콘)

#### Semantic & College Admission Badges
*   **Success / Safety (Green):**
    *   Base: `#10B981` (Emerald-500)
    *   Bg Tint: `#ECFDF5` (Emerald-50)
    *   Text: `#065F46` (Emerald-800)
    *   용도: Safety 대학 판정, 성적 상승 배지, 재학(Enrolled) 상태, 완결된 상담
*   **Warning / Match (Amber/Blue):**
    *   **Match (Blue):** Base `#3B82F6` (Blue-500), Bg `#EFF6FF`, Text `#1E40AF` (Match 대학 판정, 전규 과목)
    *   **Warning (Amber):** Base `#F59E0B` (Amber-500), Bg `#FFFBEB`, Text `#92400E` (보충 필요, 성적 유지, 재수강 이력)
*   **Danger / Reach (Rose/Red):**
    *   Base: `#F43F5E` (Rose-500)
    *   Bg Tint: `#FFF1F2` (Rose-50)
    *   Text: `#9F1239` (Rose-800)
    *   용도: Reach 대학 판정, 성적 하락 경고, 전출(Withdrawal) 상태, 계정 삭제

---

### 2.2 Typography

*   **Primary Font Family:**
    *   Korean: `Pretendard`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
    *   Numbers / English: `Inter`, `system-ui`, `sans-serif`
    *   Data / Scores / ID: `JetBrains Mono`, `Roboto Mono`, `monospace` (성적, 학번 수치 정렬용)

| 계층 (Level) | Size / Line Height | Weight | 용도 |
| :--- | :--- | :--- | :--- |
| **Display / H1** | 24px / 32px | Bold (700) | 대시보드 메인 타이틀, 학생 프로필 이름 |
| **Heading / H2** | 18px / 26px | SemiBold (600) | Bento 카드 타이틀, 모달 타이틀 |
| **Subheading / H3** | 15px / 22px | SemiBold (600) | 서브 섹션 타이틀, 테이블 카테고리 헤더 |
| **Body Primary** | 14px / 20px | Regular (400) / Med (500) | 기본 테이블 텍스트, 폼 라벨, 상담 기록 본문 |
| **Body Compact / Small** | 12px / 16px | Medium (500) | 뱃지(Badge), 필터 칩, 차트 축 라벨, 타임스탬프 |
| **KPI Metric** | 32px / 38px | Bold (700) / Mono | 4.00 만점 GPA 수치, 총 이수학점 수치 |
