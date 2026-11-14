"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Printer,
  CheckSquare,
  Square,
  School,
  Trophy,
  BookOpen,
  Compass,
  MessageSquare,
  Layers,
  Award,
  CheckCircle2,
} from "lucide-react";

interface CourseGrade {
  id: string;
  courseTitle: string;
  category: string;
  credits: number;
  originalGrade: string;
  unweightedGradePoint: number;
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

interface StandardizedTest {
  id: string;
  testType: string;
  totalScore: number | null;
  testDate: string | null;
  sectionScoresJson: string | null;
  notes: string | null;
}

interface ClubActivity {
  id: string;
  semester?: string;
  gradeLevel?: string | null;
  curricularType?: string | null;
  curricularActivity?: string | null;
  awards?: string | null;
  volunteerWork?: string | null;
  studentActivities?: string | null;
  clubName?: string | null;
  role?: string | null;
  yearsActive?: string | null;
  description?: string | null;
}

interface AwardRecord {
  id: string;
  awardTitle: string;
  awardType: string;
  awardDate: string | null;
  issuer: string | null;
}

interface CounselingLog {
  id: string;
  counselDate: string;
  category: string;
  withParent: boolean;
  title: string;
  content: string;
  actionItems: string | null;
  status: string;
  counselor: { name: string; email: string };
}

interface TargetUniversity {
  id: string;
  universityName: string;
  location: string | null;
  major: string | null;
  proposerType: string;
  applicationType: string;
  admissionTier: string;
  pros: string | null;
  cons: string | null;
  counselorNotes: string | null;
  resultStatus: string;
}

export interface StudentPrintData {
  id: string;
  studentCode: string;
  nameEn: string;
  nameKo: string | null;
  gradeLevel: number;
  status: string;
  graduationYear?: number | null;
  birthDate: string | null;
  gender: string | null;
  entryDate: string | null;
  graduationDate: string | null;
  cumulativeGpa: number;
  coreCumulativeGpa: number;
  cumulativeCredits: number;
  semesterRecords: SemesterRecord[];
  standardizedTests: StandardizedTest[];
  clubActivities: ClubActivity[];
  awardRecords: AwardRecord[];
  targetUniversities: TargetUniversity[];
  counselingLogs: CounselingLog[];
}

interface StudentDossierPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPrintData;
}

export function StudentDossierPrintModal({
  isOpen,
  onClose,
  student,
}: StudentDossierPrintModalProps) {
  // Configurable Sections for print customization
  const [includeGpaSummary, setIncludeGpaSummary] = useState(true);
  const [includeTests, setIncludeTests] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(true);
  const [includeUniversities, setIncludeUniversities] = useState(true);
  const [includeCounseling, setIncludeCounseling] = useState(true);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const printDateString = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="relative bg-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col my-auto border border-slate-300 print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:m-0">
        
        {/* Top Control Bar (Screen only - Hidden in Print) */}
        <div className="no-print bg-slate-900 text-white p-4 rounded-t-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-0 z-20 shadow-md">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold">학생 종합 대시보드 & 목표대학 리포트 인쇄 (Print Preview)</h2>
              <p className="text-[11px] text-slate-400">
                A4 규격 인쇄 및 PDF 파일 저장을 위한 고화질 최적화 뷰
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center space-x-1.5 shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>지금 인쇄 / PDF로 저장 (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options Row (Screen only) */}
        <div className="no-print bg-white border-b border-slate-200 px-5 py-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
          <span className="text-slate-400 font-bold uppercase text-[10px]">인쇄 포함 항목:</span>
          
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeGpaSummary}
              onChange={(e) => setIncludeGpaSummary(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span>학기별 GPA 추이 요약</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTests}
              onChange={(e) => setIncludeTests(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span>공인 시험 (SAT/ACT/AP)</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeActivities}
              onChange={(e) => setIncludeActivities(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span>비교과 활동 & 수상</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-blue-900">
            <input
              type="checkbox"
              checked={includeUniversities}
              onChange={(e) => setIncludeUniversities(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span>목표 대학교 2단 비교</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCounseling}
              onChange={(e) => setIncludeCounseling(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span>최근 1:1 상담 요약</span>
          </label>
        </div>

        {/* ======================================================== */}
        {/* PRINTABLE DOSSIER PAPER (Screen preview + A4 Print Target) */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-8 bg-slate-100 flex justify-center print:p-0 print:bg-white">
          <div className="bg-white w-full max-w-[210mm] p-8 sm:p-10 rounded-xl shadow-lg border border-slate-200 text-slate-800 space-y-6 print:border-none print:shadow-none print:p-0 print:rounded-none">
            
            {/* 1. Official Header */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 relative flex-shrink-0">
                    <Image
                      src="/logo.png"
                      alt="LIS Logo"
                      width={56}
                      height={56}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 font-sans uppercase">
                      Lighthouse International School
                    </h1>
                    <p className="text-xs font-bold text-slate-600">
                      등대글로벌스쿨 대학진학상담 포털 (College Counseling Dossier)
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      CEEB Code: 682019 • 140, Dongpae-ro, Paju-si, Gyeonggi-do, Korea
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded tracking-wider uppercase">
                    Official Counseling Record
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">
                    발급일자: {printDateString}
                  </div>
                  <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                    * CONFIDENTIAL (대외비)
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Student Basic Profile Grid */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">학생 성명 (Name)</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {student.nameKo ? `${student.nameKo} (${student.nameEn})` : student.nameEn}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">학번 (Student ID)</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">
                    {student.studentCode}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">학년 / 상태 (Grade & Status)</span>
                  <span className="font-bold text-slate-800">
                    {student.status === "GRADUATED"
                      ? `졸업 (Class of ${student.graduationYear || "-"})`
                      : `Grade ${student.gradeLevel} (재학)`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">졸업 예정일 (Graduation)</span>
                  <span className="font-medium text-slate-700">
                    {student.graduationDate
                      ? new Date(student.graduationDate).toLocaleDateString()
                      : student.graduationYear
                      ? `${student.graduationYear}년 6월`
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Academic Overview Bento KPI (GPA & Credits) */}
            <div className="print-page-break-avoid">
              <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-200 mb-3">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  1. 학업 성취도 종합 지표 (Academic Performance & Cumulative GPA)
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Unweighted Cumulative GPA */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    Cumulative Unweighted GPA
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                    {student.cumulativeGpa.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">/ 4.000 Scale</div>
                </div>

                {/* Core Cumulative GPA */}
                <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 text-center">
                  <div className="text-[10px] font-bold text-blue-800 uppercase">
                    5대 핵심 Core Cumulative GPA
                  </div>
                  <div className="text-2xl font-black text-blue-700 font-mono mt-1">
                    {student.coreCumulativeGpa.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-blue-500">Eng · Math · Sci · Soc · FLang</div>
                </div>

                {/* Total Credits */}
                <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 text-center">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">
                    Cumulative Credits Earned
                  </div>
                  <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                    {student.cumulativeCredits.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-emerald-600">/ 24.0 Graduation Target</div>
                </div>
              </div>

              {/* Semester Progression Table (Optional) */}
              {includeGpaSummary && student.semesterRecords.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                      <tr>
                        <th className="py-1.5 px-3">학기 (Term)</th>
                        <th className="py-1.5 px-3">학년 (Grade)</th>
                        <th className="py-1.5 px-3 text-right">학기 GPA</th>
                        <th className="py-1.5 px-3 text-right">5대 핵심 GPA</th>
                        <th className="py-1.5 px-3 text-right">취득 학점</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {student.semesterRecords.map((sem) => (
                        <tr key={sem.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-semibold text-slate-900">
                            {sem.academicYear} {sem.termName}
                          </td>
                          <td className="py-1.5 px-3">Grade {sem.gradeLevel}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-900 font-semibold">
                            {sem.termGpa.toFixed(3)}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono text-blue-700 font-semibold">
                            {sem.termCoreGpa.toFixed(3)}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono">
                            {sem.termCredits.toFixed(1)} cr
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 4. Standardized Tests */}
            {includeTests && (
              <div className="print-page-break-avoid">
                <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-200 mb-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    2. 공인 시험 성적 (Standardized Tests)
                  </h3>
                </div>

                {student.standardizedTests.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-1">등록된 공인성적이 없습니다.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {student.standardizedTests.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 font-mono text-xs">
                              {t.testType}
                            </span>
                            <span className="text-sm font-bold text-blue-700 font-mono">
                              {t.totalScore}
                            </span>
                            {t.testDate && (
                              <span className="text-[10px] text-slate-400">
                                ({new Date(t.testDate).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                          {t.notes && (
                            <div className="text-[10px] text-slate-500 mt-0.5">{t.notes}</div>
                          )}
                        </div>
                        {t.sectionScoresJson && (
                          <div className="text-[9px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {t.sectionScoresJson}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. Extra-Curricular Activities & Awards */}
            {includeActivities && (
              <div className="print-page-break-avoid">
                <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-200 mb-2">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    3. 학기별 비교과 활동 & 수상 내역 (Extra-Curricular Activities & Awards)
                  </h3>
                </div>

                {student.clubActivities.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-1">등록된 비교과 활동 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {student.clubActivities.map((c) => (
                      <div
                        key={c.id}
                        className="bg-slate-50/80 border border-slate-200 rounded-lg p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                              {c.semester || "학기 미지정"}
                            </span>
                            {c.gradeLevel && (
                              <span className="text-[10px] text-slate-600 font-semibold">
                                {c.gradeLevel}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Curricular & Student activities */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1">
                          {(c.curricularActivity || c.curricularType) && (
                            <div>
                              <strong className="text-blue-700">Curricular:</strong>{" "}
                              <span>{c.curricularActivity}</span>
                            </div>
                          )}
                          {(c.studentActivities || c.clubName) && (
                            <div>
                              <strong className="text-emerald-700">Activities:</strong>{" "}
                              <span>{c.studentActivities || c.clubName}</span>
                              {c.role && c.role !== "Member" && (
                                <span className="text-slate-500 text-[10px]"> ({c.role})</span>
                              )}
                            </div>
                          )}
                          {c.volunteerWork && (
                            <div className="sm:col-span-2">
                              <strong className="text-rose-700">Volunteer:</strong>{" "}
                              <span>{c.volunteerWork}</span>
                            </div>
                          )}
                          {c.awards && (
                            <div className="sm:col-span-2">
                              <strong className="text-amber-800">★ Awards:</strong>{" "}
                              <span className="font-semibold text-slate-900">{c.awards}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* 6. Target Universities (핵심 추가 요구사항) */}
            {/* ======================================================== */}
            {includeUniversities && (
              <div className="print-page-break-avoid">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <div className="flex items-center space-x-1.5">
                    <Compass className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      4. 목표 대학교 진학 설계 포트폴리오 (Target Universities Portfolio)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    총 {student.targetUniversities.length}개 지원 검토
                  </span>
                </div>

                {student.targetUniversities.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-1">등록된 목표 대학이 없습니다.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Teacher Recommended */}
                    <div className="space-y-2">
                      <div className="bg-slate-800 text-white px-2.5 py-1 rounded text-[10px] font-bold flex items-center justify-between">
                        <span>교사 추천 대학 (Teacher Recommended)</span>
                        <span>
                          {student.targetUniversities.filter((u) => u.proposerType === "TEACHER_RECOMMENDED").length}개
                        </span>
                      </div>

                      {student.targetUniversities
                        .filter((u) => u.proposerType === "TEACHER_RECOMMENDED")
                        .map((uni) => (
                          <div
                            key={uni.id}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1.5 text-xs"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-slate-900 text-xs">{uni.universityName}</h4>
                                <div className="text-[10px] text-slate-500">
                                  {uni.location && <span>{uni.location}</span>}
                                  {uni.major && <span> • 전공: {uni.major}</span>}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                                  {uni.applicationType}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    uni.admissionTier === "REACH"
                                      ? "bg-rose-100 text-rose-800"
                                      : uni.admissionTier === "MATCH"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {uni.admissionTier}
                                </span>
                              </div>
                            </div>

                            {/* Pros / Cons / Notes */}
                            {(uni.pros || uni.cons || uni.counselorNotes) && (
                              <div className="text-[10px] text-slate-600 pt-1 border-t border-slate-100 space-y-0.5">
                                {uni.pros && (
                                  <div>
                                    <strong className="text-emerald-700">장점:</strong> {uni.pros}
                                  </div>
                                )}
                                {uni.cons && (
                                  <div>
                                    <strong className="text-rose-700">고려사항:</strong> {uni.cons}
                                  </div>
                                )}
                                {uni.counselorNotes && (
                                  <div className="text-slate-500">
                                    <strong>상담 메모:</strong> {uni.counselorNotes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>

                    {/* Student Desired */}
                    <div className="space-y-2">
                      <div className="bg-slate-700 text-white px-2.5 py-1 rounded text-[10px] font-bold flex items-center justify-between">
                        <span>학생 희망 대학 (Student Desired)</span>
                        <span>
                          {student.targetUniversities.filter((u) => u.proposerType === "STUDENT_DESIRED").length}개
                        </span>
                      </div>

                      {student.targetUniversities
                        .filter((u) => u.proposerType === "STUDENT_DESIRED")
                        .map((uni) => (
                          <div
                            key={uni.id}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1.5 text-xs"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-slate-900 text-xs">{uni.universityName}</h4>
                                <div className="text-[10px] text-slate-500">
                                  {uni.location && <span>{uni.location}</span>}
                                  {uni.major && <span> • 전공: {uni.major}</span>}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                                  {uni.applicationType}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    uni.admissionTier === "REACH"
                                      ? "bg-rose-100 text-rose-800"
                                      : uni.admissionTier === "MATCH"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {uni.admissionTier}
                                </span>
                              </div>
                            </div>

                            {(uni.pros || uni.cons || uni.counselorNotes) && (
                              <div className="text-[10px] text-slate-600 pt-1 border-t border-slate-100 space-y-0.5">
                                {uni.pros && (
                                  <div>
                                    <strong className="text-emerald-700">장점:</strong> {uni.pros}
                                  </div>
                                )}
                                {uni.cons && (
                                  <div>
                                    <strong className="text-rose-700">고려사항:</strong> {uni.cons}
                                  </div>
                                )}
                                {uni.counselorNotes && (
                                  <div className="text-slate-500">
                                    <strong>상담 메모:</strong> {uni.counselorNotes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. Counseling Summary (Optional) */}
            {includeCounseling && student.counselingLogs.length > 0 && (
              <div className="print-page-break-avoid">
                <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-200 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    5. 최근 1:1 진학 상담 요약 (Recent Counseling Records)
                  </h3>
                </div>

                <div className="space-y-1.5">
                  {student.counselingLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{log.title}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.counselDate).toLocaleDateString()} • {log.counselor.name} 상담사
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{log.content}</p>
                      {log.actionItems && (
                        <div className="text-[10px] text-blue-700 font-semibold mt-1">
                          Next Action: {log.actionItems}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. Official Certification & Sign-off Block */}
            <div className="pt-4 border-t-2 border-slate-900 flex items-end justify-between text-xs print-page-break-avoid">
              <div className="text-[10px] text-slate-500 leading-tight">
                <p className="font-semibold text-slate-700">
                  Lighthouse International School • College Counseling Department
                </p>
                <p>본 서류는 학생의 학업 성취도 및 진학 목표 상담을 위해 발급된 공식 대시보드 리포트입니다.</p>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 mb-3">
                  진학 상담사 (College Counselor)
                </div>
                <div className="inline-block border-b border-slate-400 w-40 text-center text-xs text-slate-400 font-serif">
                  (서명 / Signature)
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
