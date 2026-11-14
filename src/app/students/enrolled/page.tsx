"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  UserCheck,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  RefreshCw,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  Layers,
  GraduationCap,
} from "lucide-react";

interface EnrolledStudent {
  id: string;
  studentCode: string;
  nameEn: string;
  nameKo: string | null;
  gradeLevel: number;
  status: string;
  birthDate: string | null;
  cumulativeGpa: number;
  coreCumulativeGpa: number;
  cumulativeCredits: number;
  _count: {
    semesterRecords: number;
    counselingLogs: number;
    targetUniversities: number;
  };
}

export default function EnrolledStudentsPage() {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<number | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"code_asc" | "gpa_desc" | "core_desc" | "name_asc">("code_asc");

  const fetchEnrolledStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/students?status=ENROLLED");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (e) {
      console.error("Fetch enrolled students error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledStudents();
  }, []);

  // Compute Grade Statistics
  const gradeStats = useMemo(() => {
    const stats: Record<number, { count: number; totalGpa: number; totalCoreGpa: number }> = {
      9: { count: 0, totalGpa: 0, totalCoreGpa: 0 },
      10: { count: 0, totalGpa: 0, totalCoreGpa: 0 },
      11: { count: 0, totalGpa: 0, totalCoreGpa: 0 },
      12: { count: 0, totalGpa: 0, totalCoreGpa: 0 },
    };

    students.forEach((s) => {
      const g = s.gradeLevel;
      if (stats[g]) {
        stats[g].count += 1;
        stats[g].totalGpa += s.cumulativeGpa;
        stats[g].totalCoreGpa += s.coreCumulativeGpa;
      }
    });

    return {
      9: {
        count: stats[9].count,
        avgGpa: stats[9].count > 0 ? (stats[9].totalGpa / stats[9].count).toFixed(2) : "0.00",
        avgCoreGpa: stats[9].count > 0 ? (stats[9].totalCoreGpa / stats[9].count).toFixed(2) : "0.00",
      },
      10: {
        count: stats[10].count,
        avgGpa: stats[10].count > 0 ? (stats[10].totalGpa / stats[10].count).toFixed(2) : "0.00",
        avgCoreGpa: stats[10].count > 0 ? (stats[10].totalCoreGpa / stats[10].count).toFixed(2) : "0.00",
      },
      11: {
        count: stats[11].count,
        avgGpa: stats[11].count > 0 ? (stats[11].totalGpa / stats[11].count).toFixed(2) : "0.00",
        avgCoreGpa: stats[11].count > 0 ? (stats[11].totalCoreGpa / stats[11].count).toFixed(2) : "0.00",
      },
      12: {
        count: stats[12].count,
        avgGpa: stats[12].count > 0 ? (stats[12].totalGpa / stats[12].count).toFixed(2) : "0.00",
        avgCoreGpa: stats[12].count > 0 ? (stats[12].totalCoreGpa / stats[12].count).toFixed(2) : "0.00",
      },
    };
  }, [students]);

  // Filter & Sort
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        // Grade filter
        if (selectedGrade !== "ALL" && s.gradeLevel !== selectedGrade) {
          return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = s.studentCode.toLowerCase().includes(q);
          const matchNameEn = s.nameEn.toLowerCase().includes(q);
          const matchNameKo = s.nameKo ? s.nameKo.includes(q) : false;
          return matchCode || matchNameEn || matchNameKo;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "gpa_desc":
            return b.cumulativeGpa - a.cumulativeGpa;
          case "core_desc":
            return b.coreCumulativeGpa - a.coreCumulativeGpa;
          case "name_asc":
            return (a.nameKo || a.nameEn).localeCompare(b.nameKo || b.nameEn);
          case "code_asc":
          default:
            return a.studentCode.localeCompare(b.studentCode);
        }
      });
  }, [students, selectedGrade, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-sans">
                재학생 목록 (Enrolled Students by Grade)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                현재 등대교육공동체에 재학 중인 고교(9~12학년) 학생 명단 및 학년별 학업 성취도 조회
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/students/cards"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>카드형 뷰</span>
          </Link>
          <Link
            href="/gpa-analytics"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1.5 transition"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>학생별 GPA 분석</span>
          </Link>
        </div>
      </div>

      {/* 2. Grade KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { grade: 9, label: "Grade 9 (9학년)", color: "blue", border: "border-blue-200", bg: "bg-blue-50/40" },
          { grade: 10, label: "Grade 10 (10학년)", color: "emerald", border: "border-emerald-200", bg: "bg-emerald-50/40" },
          { grade: 11, label: "Grade 11 (11학년)", color: "purple", border: "border-purple-200", bg: "bg-purple-50/40" },
          { grade: 12, label: "Grade 12 (12학년)", color: "amber", border: "border-amber-200", bg: "bg-amber-50/40" },
        ].map((item) => {
          const stats = gradeStats[item.grade as 9 | 10 | 11 | 12];
          const isSelected = selectedGrade === item.grade;

          return (
            <div
              key={item.grade}
              onClick={() => setSelectedGrade(isSelected ? "ALL" : item.grade)}
              className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                isSelected
                  ? "ring-2 ring-blue-600 bg-white border-blue-600"
                  : `${item.bg} ${item.border} hover:bg-white`
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{item.label}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? "bg-blue-600 text-white" : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  {stats.count}명
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">평균 GPA</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {stats.avgGpa}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">평균 Core GPA</span>
                  <span className="text-base font-black text-blue-700 font-mono">
                    {stats.avgCoreGpa}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Filter & Search Controls Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Grade Selector Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedGrade("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedGrade === "ALL"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              전체 재학생 ({students.length}명)
            </button>
            {[9, 10, 11, 12].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedGrade === g
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Grade {g} ({gradeStats[g as 9 | 10 | 11 | 12].count}명)
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름 or 학번 검색..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="code_asc">학번순 정렬</option>
              <option value="gpa_desc">전체 GPA 높은순</option>
              <option value="core_desc">5대 Core GPA 높은순</option>
              <option value="name_asc">이름 가나다순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Enrolled Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-xs">
          <div className="font-bold text-slate-900 flex items-center space-x-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {selectedGrade === "ALL" ? "전체 재학생 명단" : `Grade ${selectedGrade} 재학생 명단`}
            </span>
            <span className="text-slate-400 font-normal">
              ({filteredStudents.length}명 조회됨)
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
            재학생 목록을 불러오는 중입니다...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            일치하는 재학생이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">학번</th>
                  <th className="py-3 px-4">학생 성명</th>
                  <th className="py-3 px-4 text-center">학년</th>
                  <th className="py-3 px-4 text-right">누적 GPA</th>
                  <th className="py-3 px-4 text-right">5대 Core GPA</th>
                  <th className="py-3 px-4 text-center">취득 학점</th>
                  <th className="py-3 px-4 text-center">이수 학기</th>
                  <th className="py-3 px-4 text-center">목표 대학</th>
                  <th className="py-3 px-4 text-right">상세 조회</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {s.studentCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-xs">
                          {s.nameKo || s.nameEn}
                        </span>
                        {s.nameKo && (
                          <span className="text-[10px] text-slate-400">{s.nameEn}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.gradeLevel === 9
                            ? "bg-blue-100 text-blue-800"
                            : s.gradeLevel === 10
                            ? "bg-emerald-100 text-emerald-800"
                            : s.gradeLevel === 11
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        Grade {s.gradeLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {s.cumulativeGpa.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                      {s.coreCumulativeGpa.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {s.cumulativeCredits.toFixed(1)} cr
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {s._count.semesterRecords}개 학기
                    </td>
                    <td className="py-3 px-4 text-center">
                      {s._count.targetUniversities > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                          {s._count.targetUniversities}개 대학
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <Link
                          href={`/students/${s.id}`}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1 transition shadow-2xs"
                        >
                          <span>대시보드</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
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
