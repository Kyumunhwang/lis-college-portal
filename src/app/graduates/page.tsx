"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Search,
  Filter,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface GraduateStudent {
  id: string;
  studentCode: string;
  nameEn: string;
  nameKo: string | null;
  gradeLevel: number;
  status: string;
  graduationYear: number | null;
  graduationDate: string | null;
  cumulativeGpa: number;
  coreCumulativeGpa: number;
  cumulativeCredits: number;
  _count: {
    semesterRecords: number;
    counselingLogs: number;
    targetUniversities: number;
  };
}

export default function GraduatesPage() {
  const [students, setStudents] = useState<GraduateStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"year_desc" | "gpa_desc" | "name_asc">("year_desc");

  const fetchGraduates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/students?status=GRADUATED");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraduates();
  }, []);

  // Compute distinct graduation years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    students.forEach((s) => {
      if (s.graduationYear) years.add(s.graduationYear);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [students]);

  // Filter & Sort
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        // Year filter
        if (selectedYear !== "ALL" && s.graduationYear !== parseInt(selectedYear, 10)) {
          return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = s.studentCode.toLowerCase().includes(q);
          const matchEn = s.nameEn.toLowerCase().includes(q);
          const matchKo = s.nameKo ? s.nameKo.toLowerCase().includes(q) : false;
          return matchCode || matchEn || matchKo;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "year_desc") {
          const yDiff = (b.graduationYear || 0) - (a.graduationYear || 0);
          if (yDiff !== 0) return yDiff;
          return b.cumulativeGpa - a.cumulativeGpa;
        }
        if (sortBy === "gpa_desc") {
          return b.cumulativeGpa - a.cumulativeGpa;
        }
        if (sortBy === "name_asc") {
          return a.nameEn.localeCompare(b.nameEn);
        }
        return 0;
      });
  }, [students, selectedYear, searchQuery, sortBy]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) {
      return { total: 0, avgGpa: "0.000", avgCoreGpa: "0.000", class2026: 0 };
    }
    const sumGpa = students.reduce((acc, s) => acc + s.cumulativeGpa, 0);
    const sumCore = students.reduce((acc, s) => acc + s.coreCumulativeGpa, 0);
    const c2026 = students.filter((s) => s.graduationYear === 2026).length;

    return {
      total,
      avgGpa: (sumGpa / total).toFixed(3),
      avgCoreGpa: (sumCore / total).toFixed(3),
      class2026: c2026,
    };
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                졸업생 전용 관리 (Graduates Portal)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                등대글로벌스쿨 역대 졸업생들의 최종 성적(Unweighted & Core GPA) 및 학적 아카이브
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchGraduates}
          disabled={isLoading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>새로고침</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">총 누적 졸업생</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats.total} <span className="text-xs font-normal text-slate-500">명</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">2023 ~ 2026년도 전체</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">최신 2026년도 졸업생</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {stats.class2026} <span className="text-xs font-normal text-slate-500">명</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">2026년 봄학기 (Class of 2026)</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">졸업생 평균 전체 GPA</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats.avgGpa} <span className="text-xs font-normal text-slate-500">/ 4.000</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Unweighted Cumulative</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">졸업생 평균 Core GPA</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600">
            {stats.avgCoreGpa} <span className="text-xs font-normal text-slate-500">/ 4.000</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">5대 핵심교과 누적 평균</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-4">
        {/* Year Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            졸업 연도:
          </span>
          <button
            onClick={() => setSelectedYear("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedYear === "ALL"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            전체 ({students.length})
          </button>
          {availableYears.map((year) => {
            const count = students.filter((s) => s.graduationYear === year).length;
            return (
              <button
                key={year}
                onClick={() => setSelectedYear(year.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedYear === year.toString()
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {year}년도 졸업 ({count}명)
              </button>
            );
          })}
        </div>

        {/* Search and Sort controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="학번, 영문 이름, 한글 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 flex items-center">
              <Filter className="w-3.5 h-3.5 mr-1" /> 정렬:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="year_desc">최신 졸업년도순</option>
              <option value="gpa_desc">전체 GPA 높은순</option>
              <option value="name_asc">이름 가나다순</option>
            </select>
          </div>
        </div>
      </div>

      {/* Graduates Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs font-semibold text-slate-700">
            졸업생 목록 ({filteredStudents.length}명)
          </div>
          <span className="text-[11px] text-slate-400">
            * 4.0 만점 Unweighted 기준 산출
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            졸업생 데이터를 불러오는 중입니다...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            조회 조건에 해당하는 졸업생이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">학번</th>
                  <th className="py-3 px-4">학생 이름</th>
                  <th className="py-3 px-4 text-center">졸업 연도</th>
                  <th className="py-3 px-4 text-center">이수 학기</th>
                  <th className="py-3 px-4 text-right">전체 누적 GPA</th>
                  <th className="py-3 px-4 text-right">5대 Core GPA</th>
                  <th className="py-3 px-4 text-right">취득 학점</th>
                  <th className="py-3 px-4 text-center">상세보기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">
                      {s.studentCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                        {s.nameEn}
                      </div>
                      {s.nameKo && (
                        <div className="text-[11px] text-slate-400">{s.nameKo}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs">
                        🎓 {s.graduationYear}년도 졸업
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {s._count.semesterRecords}학기
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {s.cumulativeGpa.toFixed(3)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-purple-700 text-sm">
                        {s.coreCumulativeGpa.toFixed(3)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {s.cumulativeCredits.toFixed(1)} cr
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/students/${s.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition text-[11px] font-medium"
                      >
                        <span>성적표 조회</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
