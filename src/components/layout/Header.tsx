"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  LogOut,
  User,
  Shield,
  ShieldCheck,
  Eye,
  RefreshCw,
  ArrowRight,
  GraduationCap,
  Users,
  X,
} from "lucide-react";

interface HeaderProps {
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;
  };
}

interface SearchStudentItem {
  id: string;
  studentCode: string;
  nameEn: string;
  nameKo: string | null;
  gradeLevel: number;
  status: string;
  cumulativeGpa: number;
  coreCumulativeGpa: number;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchStudentItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Shortcut: ⌘K or Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
      }
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search fetch
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/students?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.students?.slice(0, 6) || []);
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsDropdownOpen(false);
      router.push(`/students?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setIsDropdownOpen(false);
    setSearchQuery("");
    router.push(`/students/${studentId}`);
  };

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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap">
            <Shield className="w-3 h-3 mr-1" /> Admin
          </span>
        );
      case "COUNSELOR":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
            <ShieldCheck className="w-3 h-3 mr-1" /> Counselor
          </span>
        );
      case "VIEWER":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            <Eye className="w-3 h-3 mr-1" /> Viewer
          </span>
        );
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Quick Search Bar with Real-time Dropdown */}
      <div ref={searchContainerRef} className="flex-1 max-w-md relative">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {isSearching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setIsDropdownOpen(true);
            }}
            placeholder="학생 검색 (학번, 이름, 학년... ⌘K)"
            className="w-full pl-9 pr-16 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute inset-y-0 right-7 pr-2 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/70 rounded">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Real-time Search Dropdown Popover */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
            <div className="px-3.5 py-2 bg-slate-50 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>학생 실시간 검색 결과</span>
              <span>{isSearching ? "조회 중..." : `${searchResults.length}명 발견`}</span>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {searchResults.length === 0 && !isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  일치하는 학생이 없습니다.
                </div>
              ) : (
                searchResults.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectStudent(s.id)}
                    className="p-3 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-blue-600 transition-colors">
                        {s.studentCode}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {s.nameEn} {s.nameKo && <span className="text-slate-500 font-normal">({s.nameKo})</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1.5">
                          <span>Grade {s.gradeLevel}</span>
                          <span>•</span>
                          <span>GPA: <strong className="text-slate-700">{s.cumulativeGpa.toFixed(2)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {s.status === "GRADUATED" ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          졸업
                        </span>
                      ) : s.status === "WITHDRAWAL" ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          전출
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          재학
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              onClick={handleSearchSubmit}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-center text-xs font-semibold text-blue-600 cursor-pointer flex items-center justify-center space-x-1 transition"
            >
              <span>전체 목록에서 검색 결과 보기 (Enter)</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        )}
      </div>

      {/* User Status & Logout */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
            {user.name.slice(0, 1) || <User className="w-4 h-4" />}
          </div>
          <div className="text-left hidden sm:block whitespace-nowrap">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {user.name}
            </div>
            <div className="text-[11px] text-slate-500">{user.email}</div>
          </div>
          <div className="ml-1 shrink-0">{getRoleBadge(user.role)}</div>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 shrink-0" />

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="로그아웃"
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center text-xs whitespace-nowrap shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span className="ml-1.5 hidden md:inline text-xs font-medium">로그아웃</span>
        </button>
      </div>
    </header>
  );
}
