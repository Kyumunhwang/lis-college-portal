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
  FileText,
  Calendar,
  Award,
} from "lucide-react";

interface StudentItem {
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

function StudentsListContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [students, setStudents] = useState<StudentItem[]>([]);
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

  const getStatusBadge = (student: StudentItem) => {
    switch (student.status) {
      case "ENROLLED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            재학 (Enrolled)
          </span>
        );
      case "WITHDRAWAL":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            전출 (Withdrawal)
          </span>
        );
      case "GRADUATED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            🎓 {student.graduationYear ? `${student.graduationYear}년도 졸업` : "졸업생"}
          </span>
        );
      case "LEAVE_OF_ABSENCE":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            휴학
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-sans">
              고등학교 학생 목록 (Students Roster)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            등대글로벌스쿨 9~12학년 재학생 및 전출/졸업생 인적사항, 성적 요약 및 1:1 상담 바로가기
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 block">등록된 전체 학생</span>
          <span className="text-lg font-bold text-slate-900 font-mono">
            {students.length} 명
          </span>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="학번, 영문/한글 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5" />
              <span>학년:</span>
            </div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="ALL">전체 학년</option>
              <option value="12">Grade 12 (12학년)</option>
              <option value="11">Grade 11 (11학년)</option>
              <option value="10">Grade 10 (10학년)</option>
              <option value="9">Grade 9 (9학년)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="ALL">전체 상태</option>
              <option value="ENROLLED">재학생</option>
              <option value="WITHDRAWAL">전출생</option>
              <option value="GRADUATED">졸업생</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-semibold text-slate-600 uppercase">
                <th className="py-3 px-5">학번</th>
                <th className="py-3 px-5">학생명 (영문 / 한글)</th>
                <th className="py-3 px-5">현재 학년</th>
                <th className="py-3 px-5">재학 상태</th>
                <th className="py-3 px-5">전체 누적 GPA</th>
                <th className="py-3 px-5">5대 핵심 Core GPA</th>
                <th className="py-3 px-5">상담 및 목표대학</th>
                <th className="py-3 px-5 text-right">상세 워크스페이스</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    학생 데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    검색 조건에 일치하는 학생이 없습니다.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      {student.studentCode}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{student.nameEn}</div>
                      {student.nameKo && (
                        <div className="text-[11px] text-slate-500">{student.nameKo}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-700">
                      {student.status === "GRADUATED" ? (
                        <span className="text-indigo-600 font-medium">
                          졸업생 ({student.graduationYear}년)
                        </span>
                      ) : student.status === "WITHDRAWAL" ? (
                        <span className="text-slate-500">
                          전출 (Gr.{student.gradeLevel})
                        </span>
                      ) : (
                        <span>Grade {student.gradeLevel}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {getStatusBadge(student)}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        {student.cumulativeGpa.toFixed(3)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">/ 4.000</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-blue-700 text-sm">
                        {student.coreCumulativeGpa.toFixed(3)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">/ 4.000</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                      <div className="flex items-center space-x-3">
                        <span>상담 {student._count.counselingLogs}건</span>
                        <span>대학 {student._count.targetUniversities}개</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/students/${student.id}`}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors"
                      >
                        <span>대시보드</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function StudentsListPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          학생 목록을 불러오는 중입니다...
        </div>
      }
    >
      <StudentsListContent />
    </Suspense>
  );
}
