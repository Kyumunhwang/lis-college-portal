"use client";

import { useState, useMemo } from "react";
import { X, Users, Plus, RefreshCw, Trophy, HeartHandshake, Sparkles, BookOpen } from "lucide-react";
import {
  getDynamicSemesterOptions,
  getDefaultCurrentSemester,
  CUSTOM_SEMESTER_VALUE,
} from "@/lib/academic/semesters";

interface AddClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onSuccess: () => void;
}

export function AddClubModal({
  isOpen,
  onClose,
  studentId,
  onSuccess,
}: AddClubModalProps) {
  const defaultSemester = useMemo(() => getDefaultCurrentSemester(), []);
  const semesterOptions = useMemo(() => getDynamicSemesterOptions(), []);

  const [semester, setSemester] = useState(defaultSemester);
  const [isCustomSemester, setIsCustomSemester] = useState(false);
  const [customSemester, setCustomSemester] = useState("");
  const [gradeLevel, setGradeLevel] = useState("Grade 10");
  
  // 1. Curricular Activities (Club Activity OR Music / PA)
  const [curricularType, setCurricularType] = useState<"Club Activity" | "Music / PA" | "NONE">("Club Activity");
  const [curricularActivity, setCurricularActivity] = useState("");

  // 2. Student Activities (Club Name)
  const [studentActivities, setStudentActivities] = useState("");

  // 3. Volunteer Work
  const [volunteerWork, setVolunteerWork] = useState("");

  // 4. Awards
  const [awards, setAwards] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveSemester = (isCustomSemester ? customSemester : semester).trim();
    if (!effectiveSemester) {
      setErrorMsg("활동 학기를 선택하거나 직접 입력해주세요.");
      return;
    }

    // Validation: at least one category should have data
    if (
      !curricularActivity.trim() &&
      !studentActivities.trim() &&
      !volunteerWork.trim() &&
      !awards.trim()
    ) {
      setErrorMsg("Curricular, Student Activities, Volunteer Work, Awards 중 최소 1개 이상 항목을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/students/${studentId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CLUB",
          semester: effectiveSemester,
          gradeLevel: gradeLevel.trim(),
          curricularType: curricularType !== "NONE" ? curricularType : null,
          curricularActivity: curricularActivity.trim() || null,
          studentActivities: studentActivities.trim() || null,
          volunteerWork: volunteerWork.trim() || null,
          awards: awards.trim() || null,
          // Legacy fields compatibility
          clubName: studentActivities.trim() || curricularActivity.trim() || "비교과 활동",
          role: "Member",
          yearsActive: gradeLevel.trim(),
          description: volunteerWork.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "비교과 활동 등록에 실패했습니다.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold">학생 비교과 활동 (Extra-Curricular) 추가</h2>
              <p className="text-[10px] text-slate-400">Curricular · Student Activities · Volunteer Work · Awards 학기별 기록</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* 1. Semester & Grade */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">활동 학기 (Semester) *</label>
                {isCustomSemester && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSemester(false);
                      setSemester(defaultSemester);
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    목록 선택
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
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white"
                >
                  {semesterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value={CUSTOM_SEMESTER_VALUE} className="text-blue-600 font-bold">
                    ✏️ [+ 직접 입력 (Custom)...]
                  </option>
                </select>
              ) : (
                <div>
                  <input
                    type="text"
                    value={customSemester}
                    onChange={(e) => setCustomSemester(e.target.value)}
                    placeholder="예: 2026-Summer"
                    className="w-full text-xs border-2 border-blue-500 rounded-lg p-2 font-semibold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    autoFocus
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    * 특수/비정규 학기명 직접 입력
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">활동 학년 (Grade) *</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white"
              >
                <option value="Grade 9">Grade 9 (9학년)</option>
                <option value="Grade 10">Grade 10 (10학년)</option>
                <option value="Grade 11">Grade 11 (11학년)</option>
                <option value="Grade 12">Grade 12 (12학년)</option>
              </select>
            </div>
          </div>

          {/* 2. Curricular Activities (Club Activity OR Music / PA) */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Curricular Activities (정규 교과 활동)</span>
              </label>
              <span className="text-[10px] text-slate-400">Club Activity 또는 Music/PA 택1</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCurricularType("Club Activity")}
                className={`py-1.5 px-2 rounded-lg border text-center font-medium transition ${
                  curricularType === "Club Activity"
                    ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Club Activity
              </button>
              <button
                type="button"
                onClick={() => setCurricularType("Music / PA")}
                className={`py-1.5 px-2 rounded-lg border text-center font-medium transition ${
                  curricularType === "Music / PA"
                    ? "bg-purple-50 border-purple-500 text-purple-700 font-bold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Music / PA
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurricularType("NONE");
                  setCurricularActivity("");
                }}
                className={`py-1.5 px-2 rounded-lg border text-center font-medium transition ${
                  curricularType === "NONE"
                    ? "bg-slate-100 border-slate-400 text-slate-700 font-bold"
                    : "border-slate-200 text-slate-400 hover:bg-slate-50"
                }`}
              >
                해당 없음
              </button>
            </div>

            {curricularType !== "NONE" && (
              <div>
                <input
                  type="text"
                  placeholder={
                    curricularType === "Club Activity"
                      ? "예: Soccer, Basketball, Climbing, Youthpot 등"
                      : "예: Drama, Orchestra, Drama/Orchestra, Choir 등"
                  }
                  value={curricularActivity}
                  onChange={(e) => setCurricularActivity(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* 3. Student Activities (Club Name) */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-white shadow-sm">
            <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Student Activities (Club Name / 학생 자율동아리 활동)</span>
            </label>
            <input
              type="text"
              placeholder="예: Vol.7, CCC, SPS, GreenLight, LIS Band Club, B&C (쉼표 구분)"
              value={studentActivities}
              onChange={(e) => setStudentActivities(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400">참여한 자율 동아리 및 소그룹 활동명을 있는 그대로 입력합니다.</p>
          </div>

          {/* 4. Volunteer Work */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-white shadow-sm">
            <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
              <span>Volunteer Work (봉사 활동)</span>
            </label>
            <textarea
              rows={2}
              placeholder="예: 어르신 생필품 지원 및 무료급식소 배식 봉사 (활동 항목을 그대로 기록)"
              value={volunteerWork}
              onChange={(e) => setVolunteerWork(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* 5. Awards */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-white shadow-sm">
            <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Awards (해당 학기 수상 내역)</span>
            </label>
            <textarea
              rows={2}
              placeholder="예: Honor Roll, Distinguished Christian Student, Model Student Award (줄바꿈 또는 쉼표 구분)"
              value={awards}
              onChange={(e) => setAwards(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow transition flex items-center space-x-1"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>비교과 활동 저장</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
