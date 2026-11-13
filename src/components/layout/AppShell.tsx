import { getSession } from "@/lib/auth/session";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { redirect } from "next/navigation";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar userRole={session.role} userName={session.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={session} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
