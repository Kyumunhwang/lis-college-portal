"use client";

import { useEffect, useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Edit3,
  RefreshCw,
  X,
  Sparkles,
  Info,
  ChevronRight,
  Filter,
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

export default function GpaAnalyticsPage() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadReport, setUploadReport] = useState<{
    total: number;
    success: number;
    failed: number;
    results: { filename: string; studentCode: string; nameEn: string; status: string }[];
  } | null>(null);

  // Filter State
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [termFilter, setTermFilter] = useState("ALL");

  // Credit Make-up Modal State
  const [selectedCourse, setSelectedCourse] = useState<CourseGrade | null>(null);
  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);
  const [makeupGrade, setMakeupGrade] = useState("A");
  const [makeupReason, setMakeupReason] = useState("");
  const [isSubmittingMakeup, setIsSubmittingMakeup] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async (studentId?: string) => {
    setIsLoading(true);
    try {
      const url = studentId ? `/api/gpa/overview?studentId=${studentId}` : `/api/gpa/overview`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        if (data.student) {
          setSelectedStudentId(data.student.id);
        } else if (data.students?.length > 0 && !studentId) {
          setSelectedStudentId(data.students[0].id);
        }
        setSemesters(data.semesters || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    fetchData(id);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(20);
    setUploadReport(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      setUploadProgress(50);
      const res = await fetch("/api/transcript/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (res.ok) {
        setUploadReport({
          total: data.totalFiles,
          success: data.successCount,
          failed: data.failedCount,
          results: data.results || [],
        });
        setUploadProgress(100);
        fetchData(selectedStudentId);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Network error during upload");
    } finally {
      setIsUploading(false);
    }
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
        alert(data.error || "Failed to update grade");
      }
    } catch {
      alert("Network error occurred");
    } finally {
      setIsSubmittingMakeup(false);
    }
  };

  // Prepare chart data
  const chartData = semesters.map((sem) => {
    const termLabel = `${sem.academicYear.slice(2, 4)}-${sem.academicYear.slice(7, 9)} ${sem.termName.replace("Semester", "S")}`;

    // Subject averages
    const calcCatAvg = (cat: string) => {
      const catCourses = sem.courses.filter((c) => c.category === cat && c.includeInGpa);
      if (catCourses.length === 0) return null;
      const pts = catCourses.reduce(
        (sum, c) => sum + (c.isCreditMakeup && c.adjustedGradePoint !== null ? c.adjustedGradePoint : c.unweightedGradePoint) * c.credits,
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

  // Filtered courses
  const filteredCourses = semesters.flatMap((sem) =>
    sem.courses
      .filter((c) => categoryFilter === "ALL" || c.category === categoryFilter)
      .filter(() => termFilter === "ALL" || sem.id === termFilter)
      .map((c) => ({ ...c, semesterInfo: `${sem.academicYear} ${sem.termName} (Grade ${sem.gradeLevel})` }))
  );

  const activeStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* 1. Header & Student Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              ★
            </span>
            <h1 className="text-xl font-bold text-slate-900 font-sans">
              GPA 상세 분석 & 성적표 일괄 처리 (GPA Analytics)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gradelink Transcript PDF 일괄 파싱, Unweighted 4.0 및 5대 핵심교과 Core GPA 정밀 분석
          </p>
        </div>

        {/* Student Selector */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-600">분석 학생 선택:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => handleStudentChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                [{s.studentCode}] {s.nameEn} {s.nameKo ? `(${s.nameKo})` : ""} - G{s.gradeLevel} (GPA {s.cumulativeGpa.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Batch PDF Upload Zone */}
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 shadow-sm hover:border-blue-500 transition-all">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Gradelink Official Transcript PDF 일괄 업로드
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
            성적표 PDF 파일들을 드래그 앤 드롭하거나 선택하세요 (.pdf 파일 다중 업로드 지원, 최대 50개).
            <br />
            파일명 규칙(`학번 - 이름.pdf`) 및 Gemini API가 인적사항과 학기별 성적을 자동 구조화합니다.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>파싱 및 GPA 산출 중... ({uploadProgress}%)</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>성적표 PDF 파일 선택</span>
              </>
            )}
          </button>
        </div>

        {/* Upload Progress Report */}
        {uploadReport && (
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
              <span className="flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>배치 파싱 완료 리포트</span>
              </span>
              <span>
                총 {uploadReport.total}개 파일 중{" "}
                <strong className="text-emerald-600">{uploadReport.success}개 성공</strong> /{" "}
                <strong className="text-rose-600">{uploadReport.failed}개 실패</strong>
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-slate-600">
              {uploadReport.results.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-0">
                  <span className="font-mono truncate max-w-xs">{r.filename}</span>
                  <span className={r.status === "SUCCESS" ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}>
                    {r.status === "SUCCESS" ? `✔ 학생 [${r.studentCode}] ${r.nameEn} 반영됨` : "❌ 실패"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. GPA Trend Charts (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: 전체 GPA vs 5대 핵심 Core GPA */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>차트 A: 학기별 전체 GPA vs 5대 핵심 Core GPA 추이</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                전체 이수 과목과 5대 핵심 교과(English, Math, Science, Social, FLang) 비교
              </p>
            </div>
            {activeStudent && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">누적 평점 (4.0 만점)</span>
                <span className="text-xs font-bold text-blue-700">
                  All {activeStudent.cumulativeGpa.toFixed(2)} | Core {activeStudent.coreCumulativeGpa.toFixed(2)}
                </span>
              </div>
            )}
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
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>차트 B: 5대 핵심 교과목별 성적 변화 추이</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                교과목별 상승/하락 패턴(English, Math, Science, Social, FLang)
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

      {/* 4. Transcript Detailed Grade Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header & Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900">
              상세 성적표 & Credit Make-up 관리
            </h3>
            <span className="text-xs text-slate-500">
              (총 {filteredCourses.length}개 과목 표시 중)
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5" />
              <span>교과 필터:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="ALL">전체 교과</option>
              <option value="ENGLISH">English</option>
              <option value="MATH">Math</option>
              <option value="SCIENCE">Science</option>
              <option value="SOCIAL_STUDIES">Social Studies</option>
              <option value="FOREIGN_LANGUAGE">Foreign Language</option>
              <option value="OTHER">Other (기타)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-semibold text-slate-600 uppercase">
                <th className="py-3 px-4">이수 학기</th>
                <th className="py-3 px-4">과목 코드</th>
                <th className="py-3 px-4">과목명 (Course Title)</th>
                <th className="py-3 px-4">5대 교과 카테고리</th>
                <th className="py-3 px-4">학점</th>
                <th className="py-3 px-4">최종 성적</th>
                <th className="py-3 px-4">수정 및 재수강 이력</th>
                <th className="py-3 px-4 text-right">성적 보정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    표시할 과목 성적 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {course.semesterInfo}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {course.courseCode || "-"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {course.courseTitle}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          course.category === "ENGLISH"
                            ? "bg-blue-100 text-blue-800"
                            : course.category === "MATH"
                            ? "bg-emerald-100 text-emerald-800"
                            : course.category === "SCIENCE"
                            ? "bg-purple-100 text-purple-800"
                            : course.category === "SOCIAL_STUDIES"
                            ? "bg-amber-100 text-amber-800"
                            : course.category === "FOREIGN_LANGUAGE"
                            ? "bg-pink-100 text-pink-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {course.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {course.credits.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {course.isCreditMakeup ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-amber-600 line-through text-[11px]">
                            {course.originalGrade}
                          </span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-emerald-600 text-sm">
                            {course.adjustedGrade}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({course.adjustedGradePoint?.toFixed(1)})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-slate-900">{course.originalGrade}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({course.unweightedGradePoint.toFixed(1)})
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {course.isCreditMakeup ? (
                        <div className="group relative inline-block">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 cursor-help">
                            <Info className="w-3 h-3 mr-1" /> [재수강/수정됨]
                          </span>
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-0 mb-1 z-30 w-56 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl pointer-events-none">
                            <div><strong>사유:</strong> {course.makeupReason}</div>
                            {course.auditLogs && course.auditLogs.length > 0 && (
                              <div className="mt-1 text-slate-400 border-t border-slate-700 pt-1">
                                수정자: {course.auditLogs[0].changedBy.name}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          setMakeupGrade(course.adjustedGrade || course.originalGrade || "A");
                          setMakeupReason(course.makeupReason || "");
                          setIsMakeupModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors inline-flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>수정</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal: Credit Make-up 성적 수정 */}
      {isMakeupModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>성적 수정 및 Credit Make-up 승인</span>
              </h3>
              <button
                onClick={() => setIsMakeupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-500">과목명:</span>{" "}
                <strong className="text-slate-900">{selectedCourse.courseTitle}</strong>
              </div>
              <div>
                <span className="text-slate-500">원 성적:</span>{" "}
                <span className="font-mono font-bold text-slate-800">
                  {selectedCourse.originalGrade} ({selectedCourse.unweightedGradePoint.toFixed(1)} pt)
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  변경할 성적 (Letter Grade)
                </label>
                <select
                  value={makeupGrade}
                  onChange={(e) => setMakeupGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  수정/재수강 사유 (Credit Make-up Reason)
                </label>
                <input
                  type="text"
                  placeholder="예: Summer School 재수강 완료 (88점 반영), UC Scout 대체 이수"
                  value={makeupReason}
                  onChange={(e) => setMakeupReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                ⚠️ 성적을 수정하면 학기별 GPA, 전체 누적 GPA, 5대 주요교과(Core) GPA가{" "}
                <strong>즉시 자동 재계산</strong>되며 감사 로그(Audit Trail)에 기록됩니다.
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              {selectedCourse.isCreditMakeup ? (
                <button
                  type="button"
                  onClick={() => handleApplyMakeup(true)}
                  disabled={isSubmittingMakeup}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold"
                >
                  Make-up 취소 (원상복구)
                </button>
              ) : <div />}

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsMakeupModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyMakeup(false)}
                  disabled={isSubmittingMakeup}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md"
                >
                  {isSubmittingMakeup ? "반영 중..." : "수정 반영하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
