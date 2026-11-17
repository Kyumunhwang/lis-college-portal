import { AppShell } from "@/components/layout/AppShell";

export default function TranscriptParserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
