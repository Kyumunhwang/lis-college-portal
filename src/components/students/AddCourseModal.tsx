"use client";

import { useState } from "react";
import { X, Plus, RefreshCw, BookOpen } from "lucide-react";

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  semesterRecordId: string;
  semesterName: string;
  onSuccess: () => void;
}

export function AddCourseModal({
  isOpen,
  onClose,
  studentId,
  semesterRecordId,
  semesterName,
  onSuccess,
}: AddCourseModalProps) {
  const [courseTitle, setCourseTitle] = useState("");
  const [category, setCategory] = useState("ENGLISH");
  const [credits, setCredits] = useState("0.5");
  const [originalGrade, setOriginalGrade] = useState("A");
  const [includeInGpa, setIncludeInGpa] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/students/${studentId}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semesterRecordId,
          courseTitle,
          category,
          credits,
          originalGrade,
          includeInGpa,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "과목 추가에 실패했습니다.");
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
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">새 과목 직접 추가</h2>
              <p className="text-[11px] text-slate-400">{semesterName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Course Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              과목명 (Course Title) *
            </label>
            <input
              type="text"
              required
              placeholder="예: AP Calculus BC (APEX), English IV, etc."
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Category & Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5대 핵심교과 카테고리 *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="ENGLISH">ENGLISH (영어)</option>
                <option value="MATH">MATH (수학)</option>
                <option value="SCIENCE">SCIENCE (과학)</option>
                <option value="SOCIAL_STUDIES">SOCIAL_STUDIES (사회/역사)</option>
                <option value="FOREIGN_LANGUAGE">FOREIGN_LANGUAGE (제2외국어)</option>
                <option value="OTHER">OTHER (기타 교과)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                이수 학점 (Credits) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Grade & GPA inclusion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                취득 성적 (Grade) *
              </label>
              <select
                value={originalGrade}
                onChange={(e) => setOriginalGrade(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
              >
                {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F", "P", "NP"].map(
                  (g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeInGpa}
                  onChange={(e) => setIncludeInGpa(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>GPA 산출에 반영</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-md flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>추가 중...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>과목 추가 및 GPA 갱신</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
