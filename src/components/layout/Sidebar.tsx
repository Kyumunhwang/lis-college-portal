"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getCurrentAcademicYearInfo } from "@/lib/academic/academicYear";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  LayoutGrid,
  LineChart,
  FileSpreadsheet,
  FileText,
  Settings,
  ShieldAlert,
} from "lucide-react";

interface SidebarProps {
  userRole?: string;
  userName?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const academicInfo = getCurrentAcademicYearInfo();

  const isViewer = userRole === "VIEWER";

  const navItems = [
    {
      label: "학생 대시보드",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard" || pathname === "/",
    },
    {
      label: "학생 목록 (전체)",
      href: "/students",
      icon: Users,
      active: pathname === "/students",
    },
    {
      label: "학생 목록 (카드형)",
      href: "/students/cards",
      icon: LayoutGrid,
      active: pathname === "/students/cards",
    },
    {
      label: "학생별 GPA 분석",
      href: "/gpa-analytics",
      icon: LineChart,
      active: pathname.startsWith("/gpa-analytics"),
    },
    {
      label: "졸업생 관리",
      href: "/graduates",
      icon: GraduationCap,
      active: pathname.startsWith("/graduates"),
    },
  ];

  // RBAC: Viewer (일반교사) 모드에서는 파싱 및 교사관리 메뉴 숨김 (ADMIN, COUNSELOR 전용)
  if (!isViewer) {
    navItems.push(
      {
        label: "Transcript PDF 파싱",
        href: "/transcript-parser",
        icon: FileSpreadsheet,
        active: pathname.startsWith("/transcript-parser"),
      },
      {
        label: "비교과 활동 & Word 파싱",
        href: "/extra-analytics",
        icon: FileText,
        active: pathname.startsWith("/extra-analytics"),
      },
      {
        label: "교사 계정 관리",
        href: "/teachers",
        icon: Settings,
        active: pathname.startsWith("/teachers"),
      }
    );
  }

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 flex-shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/80 space-x-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
          <Image
            src="/logo.png"
            alt="LIS Logo"
            width={36}
            height={36}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white tracking-tight leading-none truncate">
            LIS College Portal
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            CEEB: 682019
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                item.active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {isViewer && (
          <div className="pt-4 px-2">
            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-400 flex items-start space-x-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>일반교사(Viewer) 모드로 접속 중입니다. (열람 전용)</span>
            </div>
          </div>
        )}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>Academic Year</span>
          <span className="font-mono text-slate-200 font-semibold">{academicInfo.academicYear}</span>
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px]">
          <span className="text-slate-500">Current Term</span>
          <span className="font-mono text-blue-400 font-medium">{academicInfo.semester}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span>System Version</span>
          <span className="font-mono text-slate-400">v2.4 (Stable)</span>
        </div>
      </div>
    </aside>
  );
}
