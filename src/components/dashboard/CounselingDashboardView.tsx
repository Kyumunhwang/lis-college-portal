"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Compass,
  MessageSquare,
  ArrowRight,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
} from "lucide-react";

export interface DashboardCounselingLog {
  id: string;
  studentId: string;
  counselDate: string;
  category: string;
  withParent: boolean;
  title: string;
  content: string;
  actionItems: string | null;
  status: string; // "SCHEDULED" | "COMPLETED"
  isUrgent: boolean;
  nextCounselDate: string | null;
  createdAt: string;
  counselor: {
    id: string;
    name: string;
    email: string;
  };
  student: {
    id: string;
    studentCode: string;
    nameEn: string;
    nameKo: string | null;
    gradeLevel: number;
    status: string;
    cumulativeGpa: number;
    coreCumulativeGpa: number;
  };
}

interface CounselingDashboardViewProps {
  initialLogs: DashboardCounselingLog[];
  totalStudents: number;
  avgGpa: string;
  totalUniversities: number;
}

export function CounselingDashboardView({
  initialLogs,
  totalStudents,
  avgGpa,
  totalUniversities,
}: CounselingDashboardViewProps) {
  const [logs, setLogs] = useState<DashboardCounselingLog[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // "ALL", "URGENT", "SCHEDULED", "NEXT_DATE", "COMPLETED"
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Status toggle handler
  const handleToggleStatus = async (logId: string, currentStatus: string) => {
    setIsUpdating(logId);
    const newStatus = currentStatus === "COMPLETED" ? "SCHEDULED" : "COMPLETED";
    try {
      const res = await fetch(`/api/counseling/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLogs((prev) =>
          prev.map((l) => (l.id === logId ? { ...l, status: newStatus } : l))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(null);
    }
  };

  // Urgent toggle handler
  const handleToggleUrgent = async (logId: string, currentUrgent: boolean) => {
    setIsUpdating(logId);
    try {
      const res = await fetch(`/api/counseling/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isUrgent: !currentUrgent }),
      });
      if (res.ok) {
        setLogs((prev) =>
          prev.map((l) => (l.id === logId ? { ...l, isUrgent: !currentUrgent } : l))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(null);
    }
  };

  // Calculations
  const urgentLogs = logs.filter((l) => l.isUrgent && l.status !== "COMPLETED");
  const scheduledCount = logs.filter((l) => l.status === "SCHEDULED").length;
  const completedCount = logs.filter((l) => l.status === "COMPLETED").length;
  const withNextScheduleCount = logs.filter((l) => Boolean(l.nextCounselDate)).length;

  // Filtered Logs
  const filteredLogs = logs.filter((l) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = l.student.studentCode.toLowerCase().includes(q);
      const matchEn = l.student.nameEn.toLowerCase().includes(q);
      const matchKo = (l.student.nameKo || "").toLowerCase().includes(q);
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchContent = l.content.toLowerCase().includes(q);
      const matchCat = l.category.toLowerCase().includes(q);
      if (!matchCode && !matchEn && !matchKo && !matchTitle && !matchContent && !matchCat) {
        return false;
      }
    }

    // Filter
    if (statusFilter === "URGENT") return l.isUrgent;
    if (statusFilter === "SCHEDULED") return l.status === "SCHEDULED";
    if (statusFilter === "NEXT_DATE") return Boolean(l.nextCounselDate);
    if (statusFilter === "COMPLETED") return l.status === "COMPLETED";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center shadow shrink-0">
              <Image
                src="/logo.png"
                alt="LIS Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-bold font-sans">
                등대글로벌스쿨 진학상담포털 (종합 워크스페이스)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                CEEB: 682019 | 1:1 상담 일정 관리 & 긴급 상담 큐
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/students/cards"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-all flex items-center space-x-1.5"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>학생 목록 (카드형)</span>
          </Link>
          <Link
            href="/students"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>학생 목록 (전체)</span>
          </Link>
          <Link
            href="/graduates"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all flex items-center space-x-1.5"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>졸업생 관리</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter("URGENT")}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition ${
            statusFilter === "URGENT"
              ? "bg-rose-50 border-rose-300 ring-2 ring-rose-400"
              : "bg-white border-slate-200 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="text-rose-700 font-bold flex items-center space-x-1">
              <span>🚨 긴급 상담 대기</span>
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600">
            {urgentLogs.length} <span className="text-xs text-slate-400 font-normal">건</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">즉각 조치 및 상담 요망</div>
        </div>

        <div
          onClick={() => setStatusFilter("SCHEDULED")}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition ${
            statusFilter === "SCHEDULED"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400"
              : "bg-white border-slate-200 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="text-amber-800 font-bold">⏳ 상담 전 (미진행)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-700">
            {scheduledCount} <span className="text-xs text-slate-400 font-normal">건</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">상담 대기 및 예정 건</div>
        </div>

        <div
          onClick={() => setStatusFilter("NEXT_DATE")}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition ${
            statusFilter === "NEXT_DATE"
              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-400"
              : "bg-white border-slate-200 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="text-blue-800 font-bold">📅 다음 일정 지정</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-700">
            {withNextScheduleCount} <span className="text-xs text-slate-400 font-normal">건</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">차기 상담일정 수립 완료</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>등록 학생 / 평균 GPA</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {totalStudents} <span className="text-xs text-slate-400 font-normal">명</span>
            <span className="text-xs text-slate-400 font-normal font-sans ml-2">
              (GPA: {avgGpa})
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            상담 완료: <strong className="text-emerald-600">{completedCount}</strong>건
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. FIRST SECTION: 🚨 긴급 상담 리스트 (Urgent Counseling Queue) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-rose-50 to-rose-100/60 p-4 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-rose-600 text-white rounded-lg shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-rose-950 flex items-center space-x-2">
                <span>🚨 긴급 상담 리스트 (Urgent Counseling Queue)</span>
                <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-mono font-bold rounded-full">
                  {urgentLogs.length}건 대기
                </span>
              </h2>
              <p className="text-[11px] text-rose-700">
                원서 마감 임박, GPA 급락, 긴급 학부모 면담 등 즉각적인 조치가 필요한 학생 명단입니다.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {urgentLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-1.5">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              <span className="font-semibold text-slate-700 text-sm">
                현재 대기 중인 긴급 상담 건이 없습니다.
              </span>
              <span className="text-[11px] text-slate-400">
                학생 상세의 1:1 상담 작성 시 [🚨 다음 상담 긴급]을 체크하면 이곳에 자동으로 등록됩니다.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgentLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-xl border border-rose-200 shadow-sm p-4 hover:shadow-md transition flex flex-col justify-between space-y-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-rose-500" />

                  <div>
                    <div className="flex items-start justify-between pr-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-lg bg-rose-900 text-white font-mono font-bold flex items-center justify-center text-xs">
                          {log.student.studentCode}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">
                            {log.student.nameEn}{" "}
                            {log.student.nameKo && (
                              <span className="text-slate-500 font-normal">
                                ({log.student.nameKo})
                              </span>
                            )}
                          </h4>
                          <div className="text-[10px] text-slate-500">
                            Grade {log.student.gradeLevel} • GPA {log.student.cumulativeGpa.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        긴급
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                        {log.category}
                      </span>
                      <h5 className="mt-1 text-xs font-bold text-slate-900 truncate">
                        {log.title}
                      </h5>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                        {log.content}
                      </p>
                    </div>

                    {/* Next Schedule Date */}
                    {log.nextCounselDate && (
                      <div className="mt-2.5 p-2 bg-rose-50 rounded-lg border border-rose-200 text-[11px] text-rose-900 flex items-center space-x-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span>다음 상담 예정:</span>
                        <strong className="font-mono">
                          {new Date(log.nextCounselDate).toLocaleDateString()}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-[10px] text-slate-400">
                      담당: {log.counselor.name}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(log.id, log.status)}
                        disabled={isUpdating === log.id}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded text-[11px] font-semibold transition"
                      >
                        완료 처리 ✓
                      </button>
                      <Link
                        href={`/students/${log.student.id}?tab=counseling`}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold shadow-xs transition flex items-center space-x-1"
                      >
                        <span>상담 워크스페이스</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MAIN SECTION: 📅 상담 일정 (Counseling Schedule) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>상담 일정 & 전체 1:1 상담 목록</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              등대글로벌스쿨 고교생들의 예정된 상담 일정 및 지난 상담 이력 통합 관리
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/students/cards"
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span>학생별 상담 카드 목록 이동</span>
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="학생 학번, 이름, 상담 제목, 내용, 카테고리 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center space-x-1 text-slate-500 font-semibold mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>필터:</span>
            </div>
            {[
              { key: "ALL", label: `전체 (${logs.length})` },
              { key: "URGENT", label: `🚨 긴급 (${logs.filter((l) => l.isUrgent).length})` },
              { key: "SCHEDULED", label: `⏳ 상담 전/미진행 (${scheduledCount})` },
              { key: "NEXT_DATE", label: `📅 다음 일정 있음 (${withNextScheduleCount})` },
              { key: "COMPLETED", label: `✅ 완료됨 (${completedCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === tab.key
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <div className="ml-auto text-xs text-slate-500">
              조회 결과: <strong className="text-slate-900 font-mono">{filteredLogs.length}</strong>건
            </div>
          </div>
        </div>

        {/* Schedule List / Table */}
        {filteredLogs.length === 0 ? (
          <div className="bg-slate-50 p-12 rounded-xl text-center text-slate-400 text-xs">
            해당 조건에 부합하는 상담 일정이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {filteredLogs.map((log) => {
              const actions: { id: string; task: string; done: boolean }[] = log.actionItems
                ? JSON.parse(log.actionItems)
                : [];

              return (
                <div
                  key={log.id}
                  className={`p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    log.isUrgent && log.status !== "COMPLETED" ? "bg-rose-50/40" : "bg-white"
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Badge */}
                      {log.status === "COMPLETED" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>상담 완료</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>상담 전 (미진행)</span>
                        </span>
                      )}

                      {/* Urgent Badge */}
                      {log.isUrgent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          🚨 긴급
                        </span>
                      )}

                      <span className="text-xs font-mono font-bold text-slate-700">
                        {new Date(log.counselDate).toLocaleDateString()}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {log.category}
                      </span>

                      {log.withParent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          학부모 동석
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-1.5 py-0.5 rounded">
                        {log.student.studentCode}
                      </span>
                      <strong className="text-sm text-slate-900">
                        {log.student.nameEn}
                      </strong>
                      {log.student.nameKo && (
                        <span className="text-xs text-slate-500">
                          ({log.student.nameKo})
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        • Grade {log.student.gradeLevel} (GPA: {log.student.cumulativeGpa.toFixed(2)})
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800">
                      {log.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {log.content}
                    </p>

                    {/* Next Schedule Banner */}
                    {log.nextCounselDate && (
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-800 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>다음 상담일정:</span>
                        <strong className="font-mono">
                          {new Date(log.nextCounselDate).toLocaleDateString()}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 shrink-0">
                    <div className="text-[11px] text-slate-500">
                      담당: <strong>{log.counselor.name}</strong>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(log.id, log.status)}
                        disabled={isUpdating === log.id}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                          log.status === "COMPLETED"
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        }`}
                      >
                        {log.status === "COMPLETED" ? "상담 전으로 변경" : "상담 완료 처리 ✓"}
                      </button>

                      <Link
                        href={`/students/${log.student.id}?tab=counseling`}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold shadow-xs transition flex items-center space-x-1"
                      >
                        <span>1:1 상담일지</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
