import { AppShell } from "@/components/layout/AppShell";

export const metadata = {
  title: "비교과 활동 & Word 파싱 | LIS College Portal",
  description: "학기별 고등학교 학생 MS-Word (.docx) 활동 기록 일괄 파싱 및 DB 동기화 워크스페이스",
};

export default function ExtraAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
