"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronRight,
  Edit3,
  RefreshCw,
  Search,
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  ArrowRight,
  FileCheck2,
  AlertCircle,
  X,
  History,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface StudentOption {
  id: string;
  studentCode: string;
  nameEn: string;
  nameKo: string | null;
  gradeLevel: number;
  status: string;
  graduationYear?: number | null;
  cumulativeGpa: number;
  coreCumulativeGpa: number;
}

interface CourseGrade {
  id: string;
  courseCode: string | null;
  courseTitle: string;
  category: string;
  credits: number;
  originalGrade: string;
  originalPercentage: number | null;
  unweightedGradePoint: number;
  isCreditMakeup: boolean;
  adjustedGrade: string | null;
  adjustedGradePoint: number | null;
  makeupReason: string | null;
  includeInGpa: boolean;
  auditLogs?: {
    id: string;
    changedBy: { name: string };
    previousValue: string;
    newValue: string;
    reason: string;
    createdAt: string;
  }[];
}

interface SemesterRecord {
  id: string;
  academicYear: string;
  termName: string;
  gradeLevel: number;
  termGpa: number;
  termCoreGpa: number;
  termCredits: number;
  courses: CourseGrade[];
}

export default function StudentGpaAnalyticsPage() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Student Selector State: Enrolled vs Graduate & Filters
  const [studentType, setStudentType] = useState<"ENROLLED" | "GRADUATED">("ENROLLED");
  const [gradeFilter, setGradeFilter] = useState<number | "ALL">("ALL");
  const [gradYearFilter, setGradYearFilter] = useState<number | "ALL">("ALL");
  const [studentSearch, setStudentSearch] = useState("");

  // Semester Accordion State
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({});
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Credit Make-up Modal State
  const [selectedCourse, setSelectedCourse] = useState<CourseGrade | null>(null);
  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);
  const [makeupGrade, setMakeupGrade] = useState("A");
  const [makeupReason, setMakeupReason] = useState("");
  const [isSubmittingMakeup, setIsSubmittingMakeup] = useState(false);

  const fetchData = async (targetStudentId?: string) => {
    setIsLoading(true);
    try {
      const url = targetStudentId
        ? `/api/gpa/overview?studentId=${targetStudentId}`
        : `/api/gpa/overview`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const loadedStudents: StudentOption[] = data.students || [];
        setStudents(loadedStudents);

        if (data.student) {
          setSelectedStudentId(data.student.id);
          // Set student type according to current student
          if (data.student.status === "GRADUATED") {
            setStudentType("GRADUATED");
          } else {
            setStudentType("ENROLLED");
          }
        } else if (loadedStudents.length > 0 && !targetStudentId) {
          setSelectedStudentId(loadedStudents[0].id);
        }

        const semList: SemesterRecord[] = data.semesters || [];
        setSemesters(semList);

        // Default: expand all semesters
        const initialExpanded: Record<string, boolean> = {};
        semList.forEach((s) => {
          initialExpanded[s.id] = true;
        });
        setExpandedSemesters(initialExpanded);
      }
    } catch (e) {
      console.error("Fetch GPA data error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    fetchData(id);
  };

  const handleApplyMakeup = async (cancel = false) => {
    if (!selectedCourse) return;
    setIsSubmittingMakeup(true);

    try {
      const res = await fetch(`/api/grades/${selectedCourse.id}/makeup`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adjustedGrade: makeupGrade,
          makeupReason,
          cancelMakeup: cancel,
        }),
      });

      if (res.ok) {
        setIsMakeupModalOpen(false);
        fetchData(selectedStudentId);
      } else {
        const data = await res.json();
        alert(data.error || "Credit Make-up 반영에 실패했습니다.");
      }
    } catch {
      alert("네트워크 통신 오류가 발생했습니다.");
    } finally {
      setIsSubmittingMakeup(false);
    }
  };

  // Toggle single semester accordion
  const toggleSemester = (semId: string) => {
    setExpandedSemesters((prev) => ({
      ...prev,
      [semId]: !prev[semId],
    }));
  };

  // Expand / Collapse all semesters
  const expandAll = () => {
    const all: Record<string, boolean> = {};
    semesters.forEach((s) => {
      all[s.id] = true;
    });
    setExpandedSemesters(all);
  };

  const collapseAll = () => {
    setExpandedSemesters({});
  };

  // Filter students based on enrolled/graduated, grade, and search term
  const enrolledStudents = students.filter((s) => s.status !== "GRADUATED");
  const graduateStudents = students.filter((s) => s.status === "GRADUATED");

  const availableGradYears = Array.from(
    new Set(graduateStudents.map((s) => s.graduationYear).filter(Boolean))
  ).sort((a, b) => (b as number) - (a as number)) as number[];

  const candidateStudents = (studentType === "ENROLLED" ? enrolledStudents : graduateStudents).filter((s) => {
    if (studentType === "ENROLLED") {
      if (gradeFilter !== "ALL" && s.gradeLevel !== gradeFilter) return false;
    } else {
      if (gradYearFilter !== "ALL" && s.graduationYear !== gradYearFilter) return false;
    }
    if (studentSearch.trim()) {
      const query = studentSearch.toLowerCase();
      const matchNameEn = s.nameEn.toLowerCase().includes(query);
      const matchNameKo = s.nameKo ? s.nameKo.includes(query) : false;
      const matchCode = s.studentCode.toLowerCase().includes(query);
      return matchNameEn || matchNameKo || matchCode;
    }
    return true;
  });

  const activeStudent = students.find((s) => s.id === selectedStudentId);

  // Prepare chart data
  const chartData = semesters.map((sem) => {
    const termLabel = `${sem.academicYear.slice(2, 4)}-${sem.academicYear.slice(7, 9)} ${sem.termName.replace("Semester", "S")}`;

    const calcCatAvg = (cat: string) => {
      const catCourses = sem.courses.filter((c) => c.category === cat && c.includeInGpa);
      if (catCourses.length === 0) return null;
      const pts = catCourses.reduce(
        (sum, c) =>
          sum +
          (c.isCreditMakeup && c.adjustedGradePoint !== null
            ? c.adjustedGradePoint
            : c.unweightedGradePoint) *
            c.credits,
        0
      );
      const creds = catCourses.reduce((sum, c) => sum + c.credits, 0);
      return creds > 0 ? Number((pts / creds).toFixed(2)) : null;
    };

    return {
      term: termLabel,
      totalGpa: sem.termGpa,
      coreGpa: sem.termCoreGpa,
      english: calcCatAvg("ENGLISH"),
      math: calcCatAvg("MATH"),
      science: calcCatAvg("SCIENCE"),
      social: calcCatAvg("SOCIAL_STUDIES"),
      foreign: calcCatAvg("FOREIGN_LANGUAGE"),
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-sans">
                학생별 GPA 분석 (Student GPA Analytics)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                재학생(학년별) 및 졸업생별 GPA 지표 정밀 분석, 학기별 상세 성적표 및 Credit Make-up 관리
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activeStudent && (
            <Link
              href={`/students/${activeStudent.id}`}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>학생 종합 대시보드 바로가기</span>
            </Link>
          )}
          <Link
            href="/transcript-parser"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1.5 transition"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Transcript PDF 파싱</span>
          </Link>
        </div>
      </div>

      {/* 2. Structured Student Selector Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            {/* Tab: Enrolled vs Graduate */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setStudentType("ENROLLED");
                  setGradeFilter("ALL");
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  studentType === "ENROLLED"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>재학생 ({enrolledStudents.length}명)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudentType("GRADUATED");
                  setGradYearFilter("ALL");
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  studentType === "GRADUATED"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>졸업생 ({graduateStudents.length}명)</span>
              </button>
            </div>

            {/* Quick Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="이름 or 학번 검색..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
              />
            </div>
          </div>

          {/* Sub Filters: Grade for Enrolled / GradYear for Graduates */}
          <div className="flex items-center space-x-1.5 text-xs">
            {studentType === "ENROLLED" ? (
              <>
                <span className="text-slate-400 font-semibold text-[11px] mr-1">학년 선택:</span>
                {(["ALL", 9, 10, 11, 12] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGradeFilter(g)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                      gradeFilter === g
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    {g === "ALL" ? "전체" : `Grade ${g}`}
                  </button>
                ))}
              </>
            ) : (
              <>
                <span className="text-slate-400 font-semibold text-[11px] mr-1">졸업연도:</span>
                <button
                  type="button"
                  onClick={() => setGradYearFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                    gradYearFilter === "ALL"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  전체
                </button>
                {availableGradYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setGradYearFilter(yr)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                      gradYearFilter === yr
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    Class of {yr}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Candidate Student Selection Dropdown & Profile Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-700 shrink-0">
              분석 학생 선택:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 bg-slate-50 border-2 border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {candidateStudents.length === 0 ? (
                <option value="">일치하는 학생이 없습니다</option>
              ) : (
                candidateStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.studentCode}] {s.nameEn} {s.nameKo ? `(${s.nameKo})` : ""} - G{s.gradeLevel} (GPA {s.cumulativeGpa.toFixed(2)})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Active Student Quick KPI Pill */}
          {activeStudent && (
            <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">선택 학생</span>
                <span className="font-bold text-slate-900">
                  {activeStudent.nameKo ? `${activeStudent.nameKo} (${activeStudent.nameEn})` : activeStudent.nameEn}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Unweighted GPA</span>
                <span className="font-bold text-blue-700 font-mono text-sm">
                  {activeStudent.cumulativeGpa.toFixed(3)}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">5대 Core GPA</span>
                <span className="font-bold text-indigo-700 font-mono text-sm">
                  {activeStudent.coreCumulativeGpa.toFixed(3)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. GPA Trend Charts (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: 전체 GPA vs 5대 핵심 Core GPA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>차트 A: 학기별 전체 GPA vs 5대 핵심 Core GPA 추이</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                전체 이수 과목과 5대 핵심 교과(English, Math, Science, Social, FLang) 추이 비교
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="term" tick={{ fontSize: 11 }} />
                <YAxis domain={[2.0, 4.0]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line
                  type="monotone"
                  dataKey="totalGpa"
                  name="전체 GPA (All)"
                  stroke="#64748B"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="coreGpa"
                  name="5대 핵심 Core GPA"
                  stroke="#1D4ED8"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: 5대 핵심 교과목별 성적 변화 멀티 라인 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>차트 B: 5대 핵심 교과목별 성적 변화 추이</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                교과목별 상승/하락 패턴 (English, Math, Science, Social, FLang)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="term" tick={{ fontSize: 11 }} />
                <YAxis domain={[2.0, 4.0]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="english" name="English" stroke="#3B82F6" strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="math" name="Math" stroke="#10B981" strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="science" name="Science" stroke="#8B5CF6" strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="social" name="Social" stroke="#F59E0B" strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="foreign" name="F.Lang" stroke="#EC4899" strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Detailed Transcript & Credit Make-up (Semester Accordions) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        {/* Section Header & Utility Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>상세 성적표 & Credit Make-up 관리 (이수 학기별 아코디언)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              각 학기 헤더를 클릭하면 해당 학기 이수 과목과 Credit Make-up 내역이 펼쳐집니다.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Category Filter */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">전체 교과 구분</option>
                <option value="ENGLISH">English</option>
                <option value="MATH">Math</option>
                <option value="SCIENCE">Science</option>
                <option value="SOCIAL_STUDIES">Social Studies</option>
                <option value="FOREIGN_LANGUAGE">Foreign Language</option>
                <option value="BIBLE">Bible</option>
                <option value="ELECTIVE">Elective</option>
                <option value="PHYSICAL_EDUCATION">P.E.</option>
              </select>
            </div>

            {/* Expand / Collapse All Buttons */}
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
            >
              전체 펼치기
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
            >
              전체 접기
            </button>
          </div>
        </div>

        {/* Semesters List */}
        {semesters.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            등록된 학기별 성적표 기록이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {semesters.map((sem) => {
              const isExpanded = !!expandedSemesters[sem.id];
              const visibleCourses = sem.courses.filter(
                (c) => categoryFilter === "ALL" || c.category === categoryFilter
              );
              const makeupCount = sem.courses.filter((c) => c.isCreditMakeup).length;

              return (
                <div
                  key={sem.id}
                  className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all bg-white"
                >
                  {/* Clickable Semester Header Bar */}
                  <div
                    onClick={() => toggleSemester(sem.id)}
                    className="p-3.5 bg-slate-50/80 hover:bg-slate-100/90 cursor-pointer flex items-center justify-between transition-colors border-b border-transparent"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1 rounded bg-white border border-slate-200 text-slate-500 shadow-2xs">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900">
                            {sem.academicYear} {sem.termName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold">
                            Grade {sem.gradeLevel}
                          </span>
                          {makeupCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                              Make-up {makeupCount}건
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          총 {sem.courses.length}개 이수 과목
                        </span>
                      </div>
                    </div>

                    {/* Semester Metrics Summary */}
                    <div className="flex items-center space-x-4 text-xs font-semibold">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-normal">학기 GPA</span>
                        <span className="font-mono text-slate-900 font-bold">
                          {sem.termGpa.toFixed(3)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-normal">5대 Core GPA</span>
                        <span className="font-mono text-blue-700 font-bold">
                          {sem.termCoreGpa.toFixed(3)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-normal">이수 학점</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {sem.termCredits.toFixed(1)} cr
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Courses Table */}
                  {isExpanded && (
                    <div className="p-0 overflow-x-auto border-t border-slate-200">
                      <table className="w-full text-left text-xs divide-y divide-slate-100">
                        <thead className="bg-slate-100/70 text-slate-500 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2 px-3">과목명 (Course Title)</th>
                            <th className="py-2 px-3">교과 분류</th>
                            <th className="py-2 px-3 text-center">학점</th>
                            <th className="py-2 px-3 text-center">원성적 (Original)</th>
                            <th className="py-2 px-3 text-center">최종 성적 (Final GPA)</th>
                            <th className="py-2 px-3 text-center">Credit Make-up</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {visibleCourses.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-4 text-center text-xs text-slate-400">
                                해당 교과 구분의 과목이 없습니다.
                              </td>
                            </tr>
                          ) : (
                            visibleCourses.map((course) => (
                              <tr key={course.id} className="hover:bg-slate-50/60">
                                <td className="py-2 px-3 font-semibold text-slate-900">
                                  {course.courseTitle}
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      course.category === "ENGLISH"
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : course.category === "MATH"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : course.category === "SCIENCE"
                                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                                        : course.category === "SOCIAL_STUDIES"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : course.category === "FOREIGN_LANGUAGE"
                                        ? "bg-pink-50 text-pink-700 border border-pink-200"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {course.category}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center font-mono">
                                  {course.credits.toFixed(1)}
                                </td>
                                <td className="py-2 px-3 text-center font-mono">
                                  <span className="font-semibold text-slate-800">
                                    {course.originalGrade}
                                  </span>
                                  {course.originalPercentage !== null && (
                                    <span className="text-[10px] text-slate-400 ml-1">
                                      ({course.originalPercentage}%)
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center font-mono">
                                  {course.isCreditMakeup ? (
                                    <div className="inline-flex items-center space-x-1">
                                      <span className="line-through text-slate-400 text-[10px]">
                                        {course.originalGrade}
                                      </span>
                                      <span className="font-bold text-amber-600">
                                        {course.adjustedGrade}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="font-bold text-slate-900">
                                      {course.originalGrade} ({course.unweightedGradePoint.toFixed(1)})
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    onClick={() => {
                                      setSelectedCourse(course);
                                      setMakeupGrade(course.adjustedGrade || course.originalGrade || "A");
                                      setMakeupReason(course.makeupReason || "");
                                      setIsMakeupModalOpen(true);
                                    }}
                                    className={`px-2 py-1 rounded text-[11px] font-semibold border transition inline-flex items-center space-x-1 ${
                                      course.isCreditMakeup
                                        ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300"
                                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                                    }`}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>{course.isCreditMakeup ? "Make-up 수정" : "Make-up 적용"}</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Credit Make-up Modal */}
      {isMakeupModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Credit Make-up 재수강 성적 보정</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  재수강 기준 성적을 입력하면 Unweighted 4.0 및 5대 핵심 GPA에 즉시 재반영됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMakeupModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div>
                  <span className="text-slate-400">대상 과목:</span>{" "}
                  <strong className="text-slate-900">{selectedCourse.courseTitle}</strong>
                </div>
                <div>
                  <span className="text-slate-400">교과 구분:</span>{" "}
                  <span className="font-semibold">{selectedCourse.category}</span> ({selectedCourse.credits}학점)
                </div>
                <div>
                  <span className="text-slate-400">기존 취득 성적:</span>{" "}
                  <strong className="text-slate-700">{selectedCourse.originalGrade}</strong> (
                  {selectedCourse.unweightedGradePoint.toFixed(1)} pt)
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  보정 후 최종 등급 (Adjusted Grade) *
                </label>
                <select
                  value={makeupGrade}
                  onChange={(e) => setMakeupGrade(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-bold bg-white"
                >
                  {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  재수강 사유 및 승인 근거 (Reason) *
                </label>
                <textarea
                  value={makeupReason}
                  onChange={(e) => setMakeupReason(e.target.value)}
                  placeholder="예: 2024 여름 계절학기 온라인 APEX Learning 재수강 완료 (85% B+ 취득)"
                  rows={3}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              {selectedCourse.auditLogs && selectedCourse.auditLogs.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    변경 이력 로그 (Audit History)
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[10px] text-slate-500 bg-slate-50 p-2 rounded">
                    {selectedCourse.auditLogs.map((log) => (
                      <div key={log.id}>
                        {new Date(log.createdAt).toLocaleDateString()} {log.changedBy.name}:{" "}
                        {log.previousValue} ➔ {log.newValue} ({log.reason})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {selectedCourse.isCreditMakeup ? (
                  <button
                    type="button"
                    onClick={() => handleApplyMakeup(true)}
                    disabled={isSubmittingMakeup}
                    className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    Make-up 취소 (원상복구)
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsMakeupModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyMakeup(false)}
                    disabled={isSubmittingMakeup}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition"
                  >
                    {isSubmittingMakeup ? "반영 중..." : "Make-up 적용 저장"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
