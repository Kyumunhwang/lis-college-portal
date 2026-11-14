"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  getDynamicSemesterOptions,
  getDefaultCurrentSemester,
  CUSTOM_SEMESTER_VALUE,
} from "@/lib/academic/semesters";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Users,
  Trophy,
  HeartHandshake,
  Sparkles,
  BookOpen,
  Filter,
  ArrowRight,
  ExternalLink,
  Layers,
  ChevronRight,
} from "lucide-react";

interface UploadResultItem {
  filename: string;
  rawName: string;
  status: "INSERTED" | "UPDATED" | "SKIPPED" | "UNMATCHED" | "ERROR";
  error?: string;
  matchedStudent: {
    id: string;
    studentCode: string;
    nameEn: string;
    nameKo: string | null;
  } | null;
  data: {
    grade: string;
    curricularType: string | null;
    curricularActivity: string | null;
    awards: string | null;
    volunteerWork: string | null;
    studentActivities: string | null;
  } | null;
}

interface UploadResponse {
  success: boolean;
  totalFiles: number;
  matchedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  unmatchedCount: number;
  semester: string;
  gradeLevel: string;
  results: UploadResultItem[];
}

export default function ExtraAnalyticsPage() {
  const defaultSemester = useMemo(() => getDefaultCurrentSemester(), []);
  const semesterOptions = useMemo(() => getDynamicSemesterOptions(), []);

  const [semester, setSemester] = useState(defaultSemester);
  const [isCustomSemester, setIsCustomSemester] = useState(false);
  const [customSemester, setCustomSemester] = useState("");
  const [gradeLevel, setGradeLevel] = useState("Grade 9");
  const [overwrite, setOverwrite] = useState(true);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((f) =>
        f.name.toLowerCase().endsWith(".docx")
      );
      setSelectedFiles(files);
      setResponse(null);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.name.toLowerCase().endsWith(".docx")
      );
      setSelectedFiles(files);
      setResponse(null);
      setErrorMessage(null);
    }
  };

  const handleUploadAndParse = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage("업로드할 MS-Word (.docx) 파일을 최소 1개 이상 선택해주세요.");
      return;
    }

    const effectiveSemester = (isCustomSemester ? customSemester : semester).trim();
    if (!effectiveSemester) {
      setErrorMessage("활동 학기를 선택하거나 직접 입력해주세요.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMessage(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("semester", effectiveSemester);
    formData.append("gradeLevel", gradeLevel);
    formData.append("overwrite", overwrite ? "true" : "false");

    try {
      setUploadProgress(40);
      const res = await fetch("/api/activities/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "파일 파싱 및 DB 업데이트에 실패했습니다.");
      }

      setUploadProgress(100);
      setResponse(data);
    } catch (err: any) {
      setErrorMessage(err.message || "오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredResults = (response?.results || []).filter((item) => {
    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rawName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.matchedStudent &&
        (item.matchedStudent.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.matchedStudent.nameKo &&
            item.matchedStudent.nameKo.includes(searchTerm)) ||
          item.matchedStudent.studentCode.includes(searchTerm)));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-sans">
                비교과 활동 & Word 파싱 (Extra-Curricular Word Parser)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                학기별 고교(9~12학년) 학생 MS-Word (.docx) 활동 기록 일괄 파싱 및 DB 자동 동기화
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/students"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>학생 목록 (전체)</span>
          </Link>
        </div>
      </div>

      {/* 2. Upload & Config Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>학기 및 학년 설정 후 Word(.docx) 파일 업로드</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            선택한 학기와 학년 정보가 각 학생의 파일 내용과 결합되어 누적 데이터로 저장됩니다.
          </p>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                활동 학기 (Semester) *
              </label>
              {isCustomSemester && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomSemester(false);
                    setSemester(defaultSemester);
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  목록에서 선택
                </button>
              )}
            </div>

            {!isCustomSemester ? (
              <select
                value={semester}
                onChange={(e) => {
                  if (e.target.value === CUSTOM_SEMESTER_VALUE) {
                    setIsCustomSemester(true);
                    setCustomSemester("");
                  } else {
                    setSemester(e.target.value);
                  }
                }}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-medium bg-white focus:ring-2 focus:ring-blue-500"
              >
                {semesterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                <option value={CUSTOM_SEMESTER_VALUE} className="text-blue-600 font-bold">
                  ✏️ [+ 직접 입력 (Custom Semester)...]
                </option>
              </select>
            ) : (
              <div className="space-y-1">
                <input
                  type="text"
                  value={customSemester}
                  onChange={(e) => setCustomSemester(e.target.value)}
                  placeholder="예: 2026-Summer, 2027-Winter"
                  className="w-full text-xs border-2 border-blue-500 rounded-lg p-2.5 font-semibold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
                <p className="text-[10px] text-slate-500">
                  * 정규 학기 외 특수 학기 또는 비정규 학기명을 직접 입력하세요.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              대상 학년 (Target Grade) *
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-medium bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="Grade 9">Grade 9 (9학년)</option>
              <option value="Grade 10">Grade 10 (10학년)</option>
              <option value="Grade 11">Grade 11 (11학년)</option>
              <option value="Grade 12">Grade 12 (12학년)</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer p-2 bg-white rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>동일 학기 기존 기록 덮어쓰기 (Update)</span>
            </label>
          </div>
        </div>

        {/* Drag & Drop Upload Box */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center transition bg-slate-50/50 hover:bg-emerald-50/20"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-3">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            MS-Word (.docx) 파일을 여기에 끌어다 놓으세요
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
            여러 학생의 활동 기록 Word 파일을 한 번에 다중 선택하여 업로드할 수 있습니다. (예: 9학년 전체 30~50개 파일 일괄 처리)
          </p>

          <label className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer">
            <FileText className="w-4 h-4" />
            <span>내 컴퓨터에서 Word 파일 선택</span>
            <input
              type="file"
              multiple
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {selectedFiles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">
                  선택된 파일: {selectedFiles.length}개
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-[11px] text-rose-500 hover:underline"
                >
                  선택 초기화
                </button>
              </div>
              <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border border-slate-200">
                {selectedFiles.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar & Submit */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span className="flex items-center space-x-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Word 파일 파싱 및 학생 명단 대조 동기화 진행 중...</span>
              </span>
              <span className="font-mono font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={selectedFiles.length === 0 || isUploading}
            onClick={handleUploadAndParse}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>파싱 및 DB 업데이트 중...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>선택된 Word 파일 일괄 파싱 및 DB 업데이트 실행</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Results Section */}
      {response && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  동기화 완료 결과 ({response.semester} · {response.gradeLevel})
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                총 {response.totalFiles}개 파일 중 {response.matchedCount}명 학생 일치 및 DB 반영
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg border font-medium transition ${
                  statusFilter === "ALL"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                전체 ({response.results.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("INSERTED")}
                className={`px-2.5 py-1 rounded-lg border font-medium transition ${
                  statusFilter === "INSERTED"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                신규 등록 ({response.insertedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("UPDATED")}
                className={`px-2.5 py-1 rounded-lg border font-medium transition ${
                  statusFilter === "UPDATED"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                }`}
              >
                덮어쓰기 ({response.updatedCount})
              </button>
              {response.unmatchedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("UNMATCHED")}
                  className={`px-2.5 py-1 rounded-lg border font-medium transition ${
                    statusFilter === "UNMATCHED"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                  }`}
                >
                  미매칭 ({response.unmatchedCount})
                </button>
              )}
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                총 파일 수
              </span>
              <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                {response.totalFiles}
              </div>
            </div>
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">
                신규 등록 완료
              </span>
              <div className="text-xl font-extrabold text-emerald-800 font-mono mt-1">
                {response.insertedCount}
              </div>
            </div>
            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
              <span className="text-[11px] font-bold text-blue-700 uppercase">
                업데이트 (덮어쓰기)
              </span>
              <div className="text-xl font-extrabold text-blue-800 font-mono mt-1">
                {response.updatedCount}
              </div>
            </div>
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200">
              <span className="text-[11px] font-bold text-rose-700 uppercase">
                미매칭 학생
              </span>
              <div className="text-xl font-extrabold text-rose-800 font-mono mt-1">
                {response.unmatchedCount}
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="학생 이름(한글/영문), 학번 또는 파일명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">상태</th>
                  <th className="p-3">매칭 학생</th>
                  <th className="p-3">Curricular Activities</th>
                  <th className="p-3">Student Activities</th>
                  <th className="p-3">Volunteer Work</th>
                  <th className="p-3">Awards</th>
                  <th className="p-3 text-right">링크</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      일치하는 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 whitespace-nowrap">
                        {item.status === "INSERTED" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            신규 등록
                          </span>
                        )}
                        {item.status === "UPDATED" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            덮어쓰기
                          </span>
                        )}
                        {item.status === "SKIPPED" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            기존 유지
                          </span>
                        )}
                        {item.status === "UNMATCHED" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            미매칭
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {item.matchedStudent ? (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1">
                              <span>
                                {item.matchedStudent.nameEn}
                                {item.matchedStudent.nameKo &&
                                  ` (${item.matchedStudent.nameKo})`}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              학번: {item.matchedStudent.studentCode} | {item.filename}
                            </div>
                          </div>
                        ) : (
                          <div className="text-rose-600 font-medium">
                            {item.rawName}
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.filename}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {item.data?.curricularActivity ? (
                          <div className="text-slate-800">
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mr-1">
                              {item.data.curricularType || "Club Activity"}
                            </span>
                            <span>{item.data.curricularActivity}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-3 max-w-xs truncate" title={item.data?.studentActivities || ""}>
                        {item.data?.studentActivities || (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-3 max-w-xs truncate" title={item.data?.volunteerWork || ""}>
                        {item.data?.volunteerWork || (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-3 whitespace-pre-line text-[11px] text-slate-800">
                        {item.data?.awards || (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {item.matchedStudent && (
                          <Link
                            href={`/students/${item.matchedStudent.id}`}
                            target="_blank"
                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
                          >
                            <span>상세</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
