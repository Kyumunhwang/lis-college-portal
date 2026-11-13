import { AppShell } from "@/components/layout/AppShell";

export default function GraduatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
