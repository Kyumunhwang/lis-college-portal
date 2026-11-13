"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  GraduationCap,
  Calendar,
  User,
  Users,
  Shield,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  MessageSquare,
  Compass,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  MapPin,
  BookOpen,
  X,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Edit3,
} from "lucide-react";
import { StudentProfileEditModal } from "@/components/students/StudentProfileEditModal";
import { CourseEditModal } from "@/components/students/CourseEditModal";
import { AddCourseModal } from "@/components/students/AddCourseModal";
import { AddSemesterModal } from "@/components/students/AddSemesterModal";
import { AddTestModal } from "@/components/students/AddTestModal";
import { AddClubModal } from "@/components/students/AddClubModal";
import { AddAwardModal } from "@/components/students/AddAwardModal";
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
  isRepresentative: boolean;
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
  isUrgent: boolean;
  nextCounselDate: string | null;
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

interface StudentDetail {
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
  withdrawalDate: string | null;
  parentName: string | null;
  parentContact: string | null;
  address: string | null;
  cumulativeGpa: number;
  coreCumulativeGpa: number;
  cumulativeCredits: number;
  semesterRecords: SemesterRecord[];
  standardizedTests: StandardizedTest[];
  clubActivities: ClubActivity[];
  awardRecords: AwardRecord[];
  counselingLogs: CounselingLog[];
  targetUniversities: TargetUniversity[];
}

export default function StudentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const studentId = params.id as string;
  const initialTab = searchParams.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New Counseling Log Form State
  const [counselDate, setCounselDate] = useState(new Date().toISOString().slice(0, 10));
  const [counselCategory, setCounselCategory] = useState("목표대학 선정 / 원서전략");
  const [counselStatus, setCounselStatus] = useState("SCHEDULED"); // 기본 Default값: 상담하지 않음(상담 전)
  const [nextCounselDate, setNextCounselDate] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [withParent, setWithParent] = useState(false);
  const [counselTitle, setCounselTitle] = useState("");
  const [counselContent, setCounselContent] = useState("");
  const [actionItemInput, setActionItemInput] = useState("");
  const [actionItemsList, setActionItemsList] = useState<{ id: string; task: string; done: boolean }[]>([]);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // New Target University Form State
  const [isAddUniModalOpen, setIsAddUniModalOpen] = useState(false);
  const [uniName, setUniName] = useState("");
  const [uniLocation, setUniLocation] = useState("");
  const [uniMajor, setUniMajor] = useState("");
  const [uniProposer, setUniProposer] = useState("TEACHER_RECOMMENDED");
  const [uniAppType, setUniAppType] = useState("ED");
  const [uniTier, setUniTier] = useState("REACH");
  const [uniPros, setUniPros] = useState("");
  const [uniCons, setUniCons] = useState("");
  const [uniNotes, setUniNotes] = useState("");
  const [isSubmittingUni, setIsSubmittingUni] = useState(false);

  // Modals for Editing Student & Grades
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseGrade | null>(null);
  const [addCourseSemester, setAddCourseSemester] = useState<{ id: string; name: string } | null>(null);
  const [isAddSemesterModalOpen, setIsAddSemesterModalOpen] = useState(false);

  // Modals for Standardized Tests & Activities
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
  const [isAddClubModalOpen, setIsAddClubModalOpen] = useState(false);
  const [isAddAwardModalOpen, setIsAddAwardModalOpen] = useState(false);

  // RBAC: Current user role (ADMIN, COUNSELOR, VIEWER)
  const [currentUserRole, setCurrentUserRole] = useState<string>("VIEWER");
  const canEdit = currentUserRole === "ADMIN" || currentUserRole === "COUNSELOR";

  // Delete Standardized Test
  const handleDeleteTest = async (testId: string) => {
    if (!confirm("해당 공인 시험 성적을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/students/${studentId}/tests`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      });
      if (res.ok) fetchStudentData();
    } catch (e) {
      console.error("Delete test error:", e);
    }
  };

  // Delete Club or Award Activity
  const handleDeleteActivity = async (type: "CLUB" | "AWARD", itemId: string) => {
    if (!confirm(`해당 ${type === "CLUB" ? "동아리" : "수상 내역"}을(를) 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/students/${studentId}/activities`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, itemId }),
      });
      if (res.ok) fetchStudentData();
    } catch (e) {
      console.error("Delete activity error:", e);
    }
  };

  const fetchStudentData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
        if (data.currentUserRole) {
          setCurrentUserRole(data.currentUserRole);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    router.push(`/students/${studentId}?tab=${tabKey}`, { scroll: false });
  };

  // Add Action Item to form
  const handleAddActionItem = () => {
    if (!actionItemInput.trim()) return;
    setActionItemsList([
      ...actionItemsList,
      { id: Date.now().toString(), task: actionItemInput.trim(), done: false },
    ]);
    setActionItemInput("");
  };

  // Submit Counseling Log
  const handleCreateCounselingLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counselTitle || !counselContent) return;

    setIsSubmittingLog(true);
    try {
      const res = await fetch(`/api/students/${studentId}/counseling`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counselDate,
          category: counselCategory,
          withParent,
          title: counselTitle,
          content: counselContent,
          actionItems: actionItemsList,
          status: counselStatus, // Default: "SCHEDULED" (상담 전/미진행)
          nextCounselDate: nextCounselDate ? new Date(nextCounselDate).toISOString() : null,
          isUrgent,
        }),
      });

      if (res.ok) {
        setCounselTitle("");
        setCounselContent("");
        setActionItemsList([]);
        setCounselStatus("SCHEDULED");
        setNextCounselDate("");
        setIsUrgent(false);
        fetchStudentData();
      } else {
        alert("상담 일지 등록 실패");
      }
    } catch {
      alert("네트워크 오류 발생");
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Toggle Counseling Log Completion Status (상담 완료 / 미진행 전환)
  const handleToggleCounselStatus = async (logId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "SCHEDULED" : "COMPLETED";
    try {
      const res = await fetch(`/api/students/${studentId}/counseling`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId,
          status: nextStatus,
        }),
      });
      if (res.ok) {
        fetchStudentData();
      }
    } catch (e) {
      console.error("Failed to toggle status:", e);
    }
  };

  // Toggle Action Item Checkbox
  const handleToggleActionItem = async (logId: string, currentItemsJson: string | null, itemId: string) => {
    if (!currentItemsJson) return;
    try {
      const items: { id: string; task: string; done: boolean }[] = JSON.parse(currentItemsJson);
      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      );

      await fetch(`/api/students/${studentId}/counseling`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, actionItems: updatedItems }),
      });

      fetchStudentData();
    } catch (e) {
      console.error(e);
    }
  };

  // Add Target University
  const handleCreateTargetUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniName) return;

    setIsSubmittingUni(true);
    try {
      const res = await fetch(`/api/students/${studentId}/universities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityName: uniName,
          location: uniLocation,
          major: uniMajor,
          proposerType: uniProposer,
          applicationType: uniAppType,
          admissionTier: uniTier,
          pros: uniPros,
          cons: uniCons,
          counselorNotes: uniNotes,
        }),
      });

      if (res.ok) {
        setIsAddUniModalOpen(false);
        setUniName("");
        setUniLocation("");
        setUniMajor("");
        setUniPros("");
        setUniCons("");
        setUniNotes("");
        fetchStudentData();
      }
    } catch {
      alert("대학교 추가 실패");
    } finally {
      setIsSubmittingUni(false);
    }
  };

  // Delete Target University
  const handleDeleteUniversity = async (uniId: string) => {
    if (!confirm("이 목표 대학교를 리스트에서 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/students/${studentId}/universities?universityId=${uniId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchStudentData();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading || !student) {
    return (
      <div className="py-24 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
        학생 워크스페이스를 불러오는 중입니다...
      </div>
    );
  }

  // Chart data preparation
  const chartData = student.semesterRecords.map((sem) => {
    const termLabel = `${sem.academicYear.slice(2, 4)}-${sem.academicYear.slice(7, 9)} ${sem.termName.replace("Semester", "S")}`;
    return {
      term: termLabel,
      totalGpa: sem.termGpa,
      coreGpa: sem.termCoreGpa,
    };
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/students" className="hover:text-blue-600 transition flex items-center space-x-1">
          <Users className="w-3.5 h-3.5" />
          <span>학생 목록 (전체)</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800 font-mono">[{student.studentCode}] {student.nameEn}</span>
      </div>

      {/* 1. Student Profile Header Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-bold font-mono text-xl flex items-center justify-center shadow-md">
            {student.studentCode}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 font-sans">
                {student.nameEn}
              </h1>
              {student.nameKo && (
                <span className="text-sm font-medium text-slate-500">
                  ({student.nameKo})
                </span>
              )}
              {student.status === "GRADUATED" ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  🎓 {student.graduationYear ? `${student.graduationYear}년도 졸업 (Class of ${student.graduationYear})` : "졸업생"}
                </span>
              ) : student.status === "WITHDRAWAL" ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  전출 (Withdrawal)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  재학 (Grade {student.gradeLevel})
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
              <span>생년월일: {student.birthDate ? new Date(student.birthDate).toLocaleDateString() : "-"}</span>
              <span>성별: {student.gender || "-"}</span>
              <span>입학일: {student.entryDate ? new Date(student.entryDate).toLocaleDateString() : "-"}</span>
              <span>졸업예정: {student.graduationDate ? new Date(student.graduationDate).toLocaleDateString() : "-"}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {canEdit && (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 inline-flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>학적 / 정보 수정</span>
            </button>
          )}
          <button
            onClick={() => handleTabChange("counseling")}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 inline-flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>새 상담일지 작성</span>
          </button>
        </div>
      </div>

      {/* 2. Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
        {[
          { key: "overview", label: "종합 대시보드 (Overview)", icon: Layers },
          { key: "gpa", label: "GPA 상세 & 성적표", icon: TrendingUp },
          { key: "counseling", label: `1:1 진학상담 기록 (${student.counselingLogs.length})`, icon: MessageSquare },
          { key: "universities", label: `목표 대학교 (${student.targetUniversities.length})`, icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center space-x-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW (High-Density Bento Grid) */}
      {/* ======================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top 3 KPI Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: 전체 누적 Unweighted GPA */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Cumulative Unweighted GPA
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-mono font-bold text-slate-900">
                  {student.cumulativeGpa.toFixed(3)}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ 4.000 Scale</span>
              </div>
              <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${(student.cumulativeGpa / 4.0) * 100}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                <span>전체 이수 과목 반영</span>
                <span className="font-semibold text-slate-700">
                  {((student.cumulativeGpa / 4.0) * 100).toFixed(1)}% 성취도
                </span>
              </div>
            </div>

            {/* Card 2: 5대 핵심 교과 Core GPA */}
            <div className="bg-white p-5 rounded-xl border border-blue-200/80 bg-blue-50/20 shadow-sm">
              <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider flex items-center justify-between">
                <span>5대 핵심 Core Cumulative GPA</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
                  핵심 지표
                </span>
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-mono font-bold text-blue-700">
                  {student.coreCumulativeGpa.toFixed(3)}
                </span>
                <span className="text-xs text-blue-400 font-mono">/ 4.000 Scale</span>
              </div>
              <div className="mt-3 w-full bg-blue-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-700 h-full rounded-full transition-all"
                  style={{ width: `${(student.coreCumulativeGpa / 4.0) * 100}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] text-blue-600 flex justify-between">
                <span>Eng/Math/Sci/Soc/FLang 전용</span>
                <span className="font-semibold text-blue-800">
                  {((student.coreCumulativeGpa / 4.0) * 100).toFixed(1)}% 성취도
                </span>
              </div>
            </div>

            {/* Card 3: 총 이수 학점 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Cumulative Credits Earned
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-mono font-bold text-slate-900">
                  {student.cumulativeCredits.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ 24.0 Graduation Target</span>
              </div>
              <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (student.cumulativeCredits / 24.0) * 100)}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                <span>졸업 필요 잔여 학점:</span>
                <span className="font-semibold text-emerald-700">
                  {Math.max(0, 24.0 - student.cumulativeCredits).toFixed(1)} Credits
                </span>
              </div>
            </div>
          </div>

          {/* Middle Bento Grid: Standardized Tests & Extracurriculars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Card 4: Standardized Tests */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>공인 시험 대표 성적 (Standardized Tests)</span>
                </h3>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsAddTestModalOpen(true)}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold inline-flex items-center space-x-1 transition shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ 성적 입력</span>
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {student.standardizedTests.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    등록된 공인성적이 없습니다.
                    {canEdit && " 우측 상단의 '+ 성적 입력' 버튼으로 등록하세요."}
                  </div>
                ) : (
                  student.standardizedTests.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900 font-mono">
                            {t.testType}
                          </span>
                          <span className="text-sm font-bold text-blue-700 font-mono">
                            {t.totalScore}
                          </span>
                          {t.testDate && (
                            <span className="text-[10px] text-slate-400">
                              [{new Date(t.testDate).toLocaleDateString()}]
                            </span>
                          )}
                        </div>
                        {t.notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{t.notes}</div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {t.sectionScoresJson && (
                          <div className="text-[10px] font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                            {t.sectionScoresJson}
                          </div>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTest(t.id)}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded transition"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Card 5: Clubs & Awards */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>비교과 활동 & 수상 내역 (Clubs & Awards)</span>
                </h3>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-bold text-slate-600 uppercase flex items-center space-x-1.5">
                      <span>학기별 비교과 활동 (Extra-Curricular by Semester)</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Curricular · Student Activities · Volunteer · Awards)
                      </span>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsAddClubModalOpen(true)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold inline-flex items-center space-x-1 transition shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        <span>비교과 활동 추가</span>
                      </button>
                    )}
                  </div>
                  {student.clubActivities.length === 0 ? (
                    <div className="text-xs text-slate-400 py-2 bg-slate-50 rounded-lg text-center border border-dashed border-slate-200">
                      등록된 학기별 비교과 활동이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {student.clubActivities.map((c) => (
                        <div
                          key={c.id}
                          className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-3 text-xs space-y-2 hover:bg-white hover:border-slate-300 transition shadow-sm"
                        >
                          {/* Header: Semester & Grade Level */}
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                                {c.semester || "학기 미지정"}
                              </span>
                              {c.gradeLevel && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                                  {c.gradeLevel}
                                </span>
                              )}
                            </div>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleDeleteActivity("CLUB", c.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                                title="삭제"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* 1. Curricular Activities */}
                          {(c.curricularActivity || c.curricularType) && (
                            <div className="flex items-start space-x-2">
                              <span className="shrink-0 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                Curricular ({c.curricularType || "Club Activity"})
                              </span>
                              <span className="text-slate-800 font-medium">
                                {c.curricularActivity}
                              </span>
                            </div>
                          )}

                          {/* 2. Student Activities */}
                          {(c.studentActivities || (c.clubName && !c.curricularActivity)) && (
                            <div className="flex items-start space-x-2">
                              <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                Student Activities
                              </span>
                              <span className="text-slate-800 font-medium">
                                {c.studentActivities || c.clubName}
                                {c.role && c.role !== "Member" && (
                                  <span className="text-slate-500 text-[11px] ml-1">({c.role})</span>
                                )}
                              </span>
                            </div>
                          )}

                          {/* 3. Volunteer Work */}
                          {c.volunteerWork && (
                            <div className="flex items-start space-x-2">
                              <span className="shrink-0 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                Volunteer Work
                              </span>
                              <span className="text-slate-700">
                                {c.volunteerWork}
                              </span>
                            </div>
                          )}

                          {/* 4. Awards */}
                          {c.awards && (
                            <div className="flex items-start space-x-2">
                              <span className="shrink-0 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                ★ Awards
                              </span>
                              <span className="text-slate-900 font-semibold whitespace-pre-line">
                                {c.awards}
                              </span>
                            </div>
                          )}

                          {/* Legacy fallback */}
                          {!c.curricularActivity && !c.studentActivities && !c.volunteerWork && !c.awards && c.clubName && (
                            <div className="text-slate-700">
                              <strong className="text-slate-900">{c.clubName}</strong> - {c.role} ({c.yearsActive}학년)
                              {c.description && <div className="text-[11px] text-slate-500 mt-0.5">{c.description}</div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-bold text-slate-600 uppercase">
                      교내외 상장 (Awards & Honors)
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsAddAwardModalOpen(true)}
                        className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-semibold inline-flex items-center space-x-1 transition"
                      >
                        <Plus className="w-3 h-3" />
                        <span>수상내역 추가</span>
                      </button>
                    )}
                  </div>
                  {student.awardRecords.length === 0 ? (
                    <div className="text-xs text-slate-400 py-1">기록 없음</div>
                  ) : (
                    student.awardRecords.map((a) => (
                      <div key={a.id} className="text-xs text-slate-700 py-1.5 flex items-center justify-between hover:bg-slate-50 p-1 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-amber-500 font-bold">★</span>
                          <span className="font-semibold text-slate-900">{a.awardTitle}</span>
                          {a.awardDate && (
                            <span className="text-[10px] text-slate-400">
                              [{new Date(a.awardDate).toLocaleDateString()}]
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {a.issuer || a.awardType}
                          </span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity("AWARD", a.id)}
                              className="text-slate-300 hover:text-rose-600 p-1 rounded transition"
                              title="삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: GPA & TRANSCRIPT */}
      {/* ======================================================== */}
      {activeTab === "gpa" && (
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              학기별 Unweighted GPA vs 5대 핵심 Core GPA 추이
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="term" tick={{ fontSize: 11 }} />
                  <YAxis domain={[2.0, 4.0]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="totalGpa" name="전체 GPA (All)" stroke="#64748B" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="coreGpa" name="5대 핵심 Core GPA" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transcript Semesters Header & Controls */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">학기별 상세 성적표 아카이브</h3>
              <p className="text-xs text-slate-500">
                {canEdit
                  ? "과목 성적 수정, 재수강(Credit Make-up), 과목 직접 추가 및 삭제 (관리자/상담사 전용)"
                  : "학생 학기별 이수 과목 및 취득 성적표 (열람 전용)"}
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => setIsAddSemesterModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm inline-flex items-center space-x-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 새 학기 추가</span>
              </button>
            )}
          </div>

          {/* Transcript Semesters */}
          <div className="space-y-4">
            {student.semesterRecords.map((sem) => (
              <div key={sem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">
                      {sem.academicYear} {sem.termName} (Grade {sem.gradeLevel})
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs font-mono">
                    <span>학기 평점: <strong>{sem.termGpa.toFixed(3)}</strong></span>
                    <span className="text-blue-700">Core 평점: <strong>{sem.termCoreGpa.toFixed(3)}</strong></span>
                    <span>취득 학점: <strong>{sem.termCredits.toFixed(1)}</strong></span>
                    {canEdit && (
                      <button
                        onClick={() => setAddCourseSemester({ id: sem.id, name: `${sem.academicYear} ${sem.termName}` })}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md font-sans text-[11px] font-semibold inline-flex items-center space-x-1 transition"
                      >
                        <Plus className="w-3 h-3" />
                        <span>과목 추가</span>
                      </button>
                    )}
                  </div>
                </div>

                <table className="w-full text-left text-xs text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-semibold text-slate-600">
                      <th className="py-2.5 px-4">과목명</th>
                      <th className="py-2.5 px-4">교과 분류</th>
                      <th className="py-2.5 px-4">학점</th>
                      <th className="py-2.5 px-4">성적</th>
                      <th className="py-2.5 px-4">GPA 반영</th>
                      <th className="py-2.5 px-4">비고</th>
                      {canEdit && <th className="py-2.5 px-4 text-center">관리</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sem.courses.length === 0 ? (
                      <tr>
                        <td colSpan={canEdit ? 7 : 6} className="py-6 text-center text-slate-400 text-xs">
                          등록된 과목이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      sem.courses.map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-slate-900">{course.courseTitle}</span>
                            {course.courseCode && (
                              <span className="text-[10px] text-slate-400 font-mono ml-1.5">({course.courseCode})</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {course.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono">{course.credits.toFixed(1)}</td>
                          <td className="py-2.5 px-4">
                            {course.isCreditMakeup ? (
                              <span className="text-emerald-700 font-bold">
                                {course.adjustedGrade} ({course.adjustedGradePoint?.toFixed(1)})
                              </span>
                            ) : (
                              <span className="font-bold text-slate-900">
                                {course.originalGrade} ({course.unweightedGradePoint.toFixed(1)})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {course.includeInGpa ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                반영됨
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                제외
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                            {course.isCreditMakeup ? (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                [Make-up: {course.makeupReason}]
                              </span>
                            ) : "-"}
                          </td>
                          {canEdit && (
                            <td className="py-2.5 px-4 text-center">
                              <button
                                onClick={() => setEditingCourse(course)}
                                className="px-2 py-1 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded transition text-[11px] font-semibold inline-flex items-center space-x-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>수정/보정</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: COUNSELING LOGS */}
      {/* ======================================================== */}
      {activeTab === "counseling" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Write Log */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>새 1:1 상담 로그 작성</span>
            </h3>

            <form onSubmit={handleCreateCounselingLog} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">상담 일시</label>
                  <input
                    type="date"
                    value={counselDate}
                    onChange={(e) => setCounselDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">상담 진행 상태</label>
                  <select
                    value={counselStatus}
                    onChange={(e) => setCounselStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-amber-300 bg-amber-50 text-amber-900 rounded-lg text-xs font-medium"
                  >
                    <option value="SCHEDULED">상담 전 / 미진행 (Default)</option>
                    <option value="COMPLETED">상담 완료</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">상담 주제/카테고리</label>
                <select
                  value={counselCategory}
                  onChange={(e) => setCounselCategory(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="목표대학 선정 / 원서전략">목표대학 선정 / 원서전략</option>
                  <option value="학업 및 GPA 관리">학업 및 GPA 관리</option>
                  <option value="공인성적(SAT/TOEFL) 점검">공인성적(SAT/TOEFL) 점검</option>
                  <option value="비교과 및 에세이 피드백">비교과 및 에세이 피드백</option>
                  <option value="학부모 정기 면담">학부모 정기 면담</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="parentCheck"
                  checked={withParent}
                  onChange={(e) => setWithParent(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="parentCheck" className="text-xs text-slate-700 font-medium">
                  학부모 동석 상담
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">상담 제목</label>
                <input
                  type="text"
                  required
                  placeholder="예: 12학년 1학기 Early 타겟 점검"
                  value={counselTitle}
                  onChange={(e) => setCounselTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">상세 상담 내용</label>
                <textarea
                  rows={4}
                  required
                  placeholder="상담 내용을 상세히 기록하세요..."
                  value={counselContent}
                  onChange={(e) => setCounselContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Action items builder */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">할 일 (Action Items)</label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    placeholder="예: AP Calculus A 유지할 것"
                    value={actionItemInput}
                    onChange={(e) => setActionItemInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddActionItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddActionItem}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    추가
                  </button>
                </div>

                {actionItemsList.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {actionItemsList.map((item, idx) => (
                      <div key={idx} className="text-xs text-slate-600 flex items-center justify-between bg-slate-50 p-1.5 rounded">
                        <span>• {item.task}</span>
                        <button
                          type="button"
                          onClick={() => setActionItemsList(actionItemsList.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 신규: 다음 상담일정 및 긴급 상담 설정 */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">다음 상담일정</label>
                  <span className="text-[10px] text-slate-400">선택사항</span>
                </div>
                <input
                  type="date"
                  value={nextCounselDate}
                  onChange={(e) => setNextCounselDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />

                <div className="pt-2 border-t border-slate-200">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-rose-700 flex items-center space-x-1">
                      <span>🚨 다음 상담 긴급 (Urgent)</span>
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 pl-6">
                    체크 시 학생 대시보드의 <strong>[긴급 상담 리스트]</strong> 최상단에 즉시 표시됩니다.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingLog}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
              >
                {isSubmittingLog ? "저장 중..." : "상담 일지 저장"}
              </button>
            </form>
          </div>

          {/* Right Panel: Timeline History */}
          <div className="lg:col-span-2 space-y-4">
            {student.counselingLogs.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                작성된 상담 기록이 없습니다.
              </div>
            ) : (
              student.counselingLogs.map((log) => {
                const actions: { id: string; task: string; done: boolean }[] = log.actionItems
                  ? JSON.parse(log.actionItems)
                  : [];

                return (
                  <div key={log.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {new Date(log.counselDate).toLocaleDateString()}
                        </span>

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
                            🚨 긴급 상담
                          </span>
                        )}

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
                        <div className="text-[11px] text-slate-500">
                          상담교사: <strong>{log.counselor.name}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleCounselStatus(log.id, log.status)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                            log.status === "COMPLETED"
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          }`}
                        >
                          {log.status === "COMPLETED" ? "상담 전으로 변경" : "상담 완료 처리 ✓"}
                        </button>
                      </div>
                    </div>

                    {/* Next Schedule Banner if exists */}
                    {log.nextCounselDate && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                          log.isUrgent
                            ? "bg-rose-50 border-rose-200 text-rose-900"
                            : "bg-blue-50 border-blue-200 text-blue-900"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Calendar className={`w-4 h-4 ${log.isUrgent ? "text-rose-600" : "text-blue-600"}`} />
                          <span className="font-semibold">다음 상담일정:</span>
                          <span className="font-mono font-bold">
                            {new Date(log.nextCounselDate).toLocaleDateString()}
                          </span>
                        </div>
                        {log.isUrgent && (
                          <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">
                            긴급 안건
                          </span>
                        )}
                      </div>
                    )}

                    <h4 className="text-sm font-bold text-slate-900">{log.title}</h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {log.content}
                    </p>

                    {actions.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                          Action Items (할 일 점검)
                        </div>
                        <div className="space-y-1">
                          {actions.map((act) => (
                            <button
                              key={act.id}
                              onClick={() => handleToggleActionItem(log.id, log.actionItems, act.id)}
                              className="flex items-center space-x-2 text-xs text-left w-full hover:bg-slate-50 p-1 rounded transition-colors"
                            >
                              {act.done ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              )}
                              <span className={act.done ? "line-through text-slate-400" : "text-slate-800"}>
                                {act.task}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: TARGET UNIVERSITIES */}
      {/* ======================================================== */}
      {activeTab === "universities" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                목표 대학교 2단 워크스페이스 (Target Universities)
              </h3>
              <p className="text-xs text-slate-500">
                교사 제안(Teacher Recommended) vs 학생 희망(Student Desired) 2단 비교
              </p>
            </div>
            <button
              onClick={() => setIsAddUniModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>새 목표 대학 추가</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column A: Teacher Recommended */}
            <div className="space-y-4">
              <div className="bg-slate-800 text-white p-3 rounded-lg text-xs font-bold flex items-center justify-between">
                <span>교사 추천 대학 (Teacher Recommended)</span>
                <span className="bg-slate-700 px-2 py-0.5 rounded text-[10px]">
                  {student.targetUniversities.filter((u) => u.proposerType === "TEACHER_RECOMMENDED").length}개
                </span>
              </div>

              {student.targetUniversities
                .filter((u) => u.proposerType === "TEACHER_RECOMMENDED")
                .map((uni) => (
                  <div key={uni.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 relative group">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{uni.universityName}</h4>
                        <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                          {uni.location && <span>{uni.location}</span>}
                          {uni.major && <span>• 전공: {uni.major}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteUniversity(uni.id)}
                        className="text-slate-300 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        {uni.applicationType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          uni.admissionTier === "REACH"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : uni.admissionTier === "MATCH"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {uni.admissionTier}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-700 pt-2 border-t border-slate-100">
                      {uni.pros && (
                        <div>
                          <strong className="text-emerald-700">Pros:</strong> {uni.pros}
                        </div>
                      )}
                      {uni.cons && (
                        <div>
                          <strong className="text-rose-700">Cons:</strong> {uni.cons}
                        </div>
                      )}
                      {uni.counselorNotes && (
                        <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-600 mt-2">
                          <strong>상담사 노트:</strong> {uni.counselorNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Column B: Student Desired */}
            <div className="space-y-4">
              <div className="bg-blue-900 text-white p-3 rounded-lg text-xs font-bold flex items-center justify-between">
                <span>학생 희망 대학 (Student Desired)</span>
                <span className="bg-blue-800 px-2 py-0.5 rounded text-[10px]">
                  {student.targetUniversities.filter((u) => u.proposerType === "STUDENT_DESIRED").length}개
                </span>
              </div>

              {student.targetUniversities
                .filter((u) => u.proposerType === "STUDENT_DESIRED")
                .map((uni) => (
                  <div key={uni.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 relative group">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{uni.universityName}</h4>
                        <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                          {uni.location && <span>{uni.location}</span>}
                          {uni.major && <span>• 전공: {uni.major}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteUniversity(uni.id)}
                        className="text-slate-300 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        {uni.applicationType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          uni.admissionTier === "REACH"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : uni.admissionTier === "MATCH"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {uni.admissionTier}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-700 pt-2 border-t border-slate-100">
                      {uni.pros && (
                        <div>
                          <strong className="text-emerald-700">Pros:</strong> {uni.pros}
                        </div>
                      )}
                      {uni.cons && (
                        <div>
                          <strong className="text-rose-700">Cons:</strong> {uni.cons}
                        </div>
                      )}
                      {uni.counselorNotes && (
                        <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-600 mt-2">
                          <strong>상담사 노트:</strong> {uni.counselorNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: 새 목표 대학 추가 */}
      {isAddUniModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">새 목표 대학 등록</h3>
              <button onClick={() => setIsAddUniModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTargetUniversity} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">대학교명</label>
                <input
                  type="text"
                  required
                  placeholder="예: Cornell University, Purdue University"
                  value={uniName}
                  onChange={(e) => setUniName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">위치/국가</label>
                  <input
                    type="text"
                    placeholder="예: Ithaca, NY"
                    value={uniLocation}
                    onChange={(e) => setUniLocation(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">희망 전공</label>
                  <input
                    type="text"
                    placeholder="예: Mechanical Eng"
                    value={uniMajor}
                    onChange={(e) => setUniMajor(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">제안 주체</label>
                  <select
                    value={uniProposer}
                    onChange={(e) => setUniProposer(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="TEACHER_RECOMMENDED">교사 제안</option>
                    <option value="STUDENT_DESIRED">학생 희망</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">지원 전형</label>
                  <select
                    value={uniAppType}
                    onChange={(e) => setUniAppType(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="ED">ED</option>
                    <option value="EA">EA</option>
                    <option value="REGULAR">Regular</option>
                    <option value="ROLLING">Rolling</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">판정 구분</label>
                  <select
                    value={uniTier}
                    onChange={(e) => setUniTier(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="REACH">Reach (상향)</option>
                    <option value="MATCH">Match (적정)</option>
                    <option value="SAFETY">Safety (안정)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">장점 (Pros)</label>
                <input
                  type="text"
                  placeholder="예: 전공 적합성 우수, 동문 네트워크"
                  value={uniPros}
                  onChange={(e) => setUniPros(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">단점 (Cons)</label>
                <input
                  type="text"
                  placeholder="예: 낮은 합격률, 학비 부담"
                  value={uniCons}
                  onChange={(e) => setUniCons(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">진학상담사 전문 코멘트</label>
                <textarea
                  rows={2}
                  placeholder="추천서 필요 여부, 포트폴리오 준비 등..."
                  value={uniNotes}
                  onChange={(e) => setUniNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddUniModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUni}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow"
                >
                  {isSubmittingUni ? "등록 중..." : "대학 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 학적 및 학생 기본 정보 수정 모달 */}
      {isProfileModalOpen && student && (
        <StudentProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          student={student}
          onSuccess={fetchStudentData}
        />
      )}

      {/* 과목 상세 수정 및 Credit Make-up 모달 */}
      {editingCourse && (
        <CourseEditModal
          isOpen={!!editingCourse}
          onClose={() => setEditingCourse(null)}
          course={editingCourse}
          onSuccess={fetchStudentData}
        />
      )}

      {/* 새 과목 추가 모달 */}
      {addCourseSemester && (
        <AddCourseModal
          isOpen={!!addCourseSemester}
          onClose={() => setAddCourseSemester(null)}
          studentId={student.id}
          semesterRecordId={addCourseSemester.id}
          semesterName={addCourseSemester.name}
          onSuccess={fetchStudentData}
        />
      )}

      {/* 새 학기 추가 모달 */}
      {isAddSemesterModalOpen && student && (
        <AddSemesterModal
          isOpen={isAddSemesterModalOpen}
          onClose={() => setIsAddSemesterModalOpen(false)}
          studentId={student.id}
          onSuccess={fetchStudentData}
        />
      )}

      {/* 공인 시험 성적 추가 모달 */}
      {isAddTestModalOpen && student && (
        <AddTestModal
          isOpen={isAddTestModalOpen}
          onClose={() => setIsAddTestModalOpen(false)}
          studentId={student.id}
          onSuccess={fetchStudentData}
        />
      )}

      {/* 동아리 활동 추가 모달 */}
      {isAddClubModalOpen && student && (
        <AddClubModal
          isOpen={isAddClubModalOpen}
          onClose={() => setIsAddClubModalOpen(false)}
          studentId={student.id}
          onSuccess={fetchStudentData}
        />
      )}

      {/* 수상 내역 추가 모달 */}
      {isAddAwardModalOpen && student && (
        <AddAwardModal
          isOpen={isAddAwardModalOpen}
          onClose={() => setIsAddAwardModalOpen(false)}
          studentId={student.id}
          onSuccess={fetchStudentData}
        />
      )}
    </div>
  );
}
