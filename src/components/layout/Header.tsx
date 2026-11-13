"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LogOut, User, Shield, ShieldCheck, Eye } from "lucide-react";

interface HeaderProps {
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;
  };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3 mr-1" /> Admin
          </span>
        );
      case "COUNSELOR":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 mr-1" /> Counselor
          </span>
        );
      case "VIEWER":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Eye className="w-3 h-3 mr-1" /> Viewer
          </span>
        );
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Quick Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="학생 검색 (학번, 이름, 학년... ⌘K)"
            className="w-full pl-9 pr-12 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                router.push(`/students?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
              }
            }}
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/70 rounded">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* User Status & Logout */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
            {user.name.slice(0, 1) || <User className="w-4 h-4" />}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {user.name}
            </div>
            <div className="text-[11px] text-slate-500">{user.email}</div>
          </div>
          <div className="ml-1">{getRoleBadge(user.role)}</div>
        </div>

        <div className="h-4 w-[1px] bg-slate-200" />

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="로그아웃"
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center text-xs"
        >
          <LogOut className="w-4 h-4" />
          <span className="ml-1.5 hidden md:inline text-xs font-medium">로그아웃</span>
        </button>
      </div>
    </header>
  );
}
