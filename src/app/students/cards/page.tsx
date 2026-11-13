"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  ArrowRight,
  RefreshCw,
  Compass,
  MessageSquare,
  FileSpreadsheet,
  LayoutGrid,
} from "lucide-react";

interface StudentCardItem {
  id: string;
  studentCode: string;
  nameEn: string;
  nameKo: string | null;
  gradeLevel: number;
  status: string;
  graduationYear?: number | null;
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

function StudentCardsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [students, setStudents] = useState<StudentCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (gradeFilter !== "ALL") params.set("grade", gradeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/students?${params.toString()}`);
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
    fetchStudents();
  }, [gradeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const getStatusBadge = (student: StudentCardItem) => {
    if (student.status === "GRADUATED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          🎓 {student.graduationYear ? `${student.graduationYear}년도 졸업` : "졸업생"}
        </span>
      );
    }
    if (student.status === "WITHDRAWAL") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          전출
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        재학 (Gr. {student.gradeLevel})
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <LayoutGrid className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              고등학교 학생 목록 (카드형 워크스페이스)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            학생별 진학상담 워크스페이스, GPA 및 상담 기록 바로가기 카드 덱
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/students"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>테이블 목록형 보기</span>
          </Link>
          <button
            onClick={fetchStudents}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="학번, 영문 이름, 한글 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            검색
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">학년:</span>
          </div>
          {["ALL", "9", "10", "11", "12"].map((g) => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                gradeFilter === g
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {g === "ALL" ? "전체 학년" : `${g}학년`}
            </button>
          ))}

          <span className="text-slate-300">|</span>

          <div className="flex items-center space-x-1.5 text-slate-500">
            <span className="font-semibold">상태:</span>
          </div>
          {[
            { key: "ALL", label: "전체" },
            { key: "ENROLLED", label: "재학생" },
            { key: "GRADUATED", label: "졸업생" },
            { key: "WITHDRAWAL", label: "전출생" },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                statusFilter === st.key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.label}
            </button>
          ))}

          <div className="ml-auto text-xs text-slate-500">
            검색 결과: <strong className="text-slate-900 font-mono">{students.length}</strong> 명
          </div>
        </div>
      </div>

      {/* Student Cards Grid */}
      {isLoading ? (
        <div className="bg-white p-16 rounded-xl border border-slate-200 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>학생 카드 목록을 불러오는 중...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white p-16 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
          검색 조건에 일치하는 학생이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-sm shadow-xs">
                      {student.studentCode}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {student.nameEn}
                      </h3>
                      <div className="text-[11px] text-slate-500">
                        {student.nameKo ? `${student.nameKo} • ` : ""}Grade {student.gradeLevel}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(student)}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Cumulative GPA</span>
                    <strong className="text-slate-800 text-sm">{student.cumulativeGpa.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-500 block font-sans">5대 Core GPA</span>
                    <strong className="text-blue-700 text-sm">{student.coreCumulativeGpa.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Counts snippet */}
                <div className="mt-3 flex items-center space-x-3 text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                    <span>상담: <strong>{student._count.counselingLogs}</strong>건</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Compass className="w-3.5 h-3.5 text-blue-500" />
                    <span>목표대학: <strong>{student._count.targetUniversities}</strong>개</span>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  이수: {student.cumulativeCredits.toFixed(1)} / 24.0
                </span>
                <Link
                  href={`/students/${student.id}`}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1 shadow-xs transition"
                >
                  <span>상담 대시보드</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentCardsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">로딩 중...</div>}>
      <StudentCardsContent />
    </Suspense>
  );
}
