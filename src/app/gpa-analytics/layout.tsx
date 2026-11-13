import { AppShell } from "@/components/layout/AppShell";

export default function GpaAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
