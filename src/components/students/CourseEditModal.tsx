"use client";

import { useState } from "react";
import { X, Save, Trash2, RefreshCw, BookOpen, AlertTriangle } from "lucide-react";

interface CourseGradeData {
  id: string;
  courseTitle: string;
  category: string;
  credits: number;
  originalGrade: string;
  isCreditMakeup: boolean;
  adjustedGrade: string | null;
  adjustedGradePoint: number | null;
  makeupReason: string | null;
  includeInGpa: boolean;
}

interface CourseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseGradeData;
  onSuccess: () => void;
}

export function CourseEditModal({
  isOpen,
  onClose,
  course,
  onSuccess,
}: CourseEditModalProps) {
  const [formData, setFormData] = useState({
    courseTitle: course.courseTitle,
    category: course.category,
    credits: course.credits.toString(),
    originalGrade: course.originalGrade,
    isCreditMakeup: course.isCreditMakeup,
    adjustedGrade: course.adjustedGrade || course.originalGrade,
    makeupReason: course.makeupReason || "",
    includeInGpa: course.includeInGpa,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/grades/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: formData.courseTitle,
          category: formData.category,
          credits: formData.credits,
          originalGrade: formData.originalGrade,
          isCreditMakeup: formData.isCreditMakeup,
          adjustedGrade: formData.isCreditMakeup ? formData.adjustedGrade : null,
          makeupReason: formData.isCreditMakeup ? formData.makeupReason : null,
          includeInGpa: formData.includeInGpa,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "과목 수정에 실패했습니다.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`정말로 '${course.courseTitle}' 과목을 삭제하시겠습니까?\n삭제 즉시 전체 GPA와 Core GPA가 자동 재계산됩니다.`)) {
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/grades/${course.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "과목 삭제에 실패했습니다.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold">성적표 과목 정보 및 성적 수정</h2>
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
              value={formData.courseTitle}
              onChange={(e) => setFormData({ ...formData, courseTitle: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>

          {/* Category & Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5대 핵심교과 카테고리 *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-purple-500 font-medium"
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
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Original Grade & GPA inclusion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                원본 성적 (Original Grade) *
              </label>
              <select
                value={formData.originalGrade}
                onChange={(e) => setFormData({ ...formData, originalGrade: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-purple-500 font-mono font-bold"
              >
                {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F", "P", "NP", "I"].map(
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
                  checked={formData.includeInGpa}
                  onChange={(e) => setFormData({ ...formData, includeInGpa: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>GPA 산출에 반영 (Include in GPA)</span>
              </label>
            </div>
          </div>

          {/* Credit Make-up Section */}
          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-amber-900">
                <input
                  type="checkbox"
                  checked={formData.isCreditMakeup}
                  onChange={(e) => setFormData({ ...formData, isCreditMakeup: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>Credit Make-up (재수강 / 성적 수동 보정) 적용</span>
              </label>
            </div>

            {formData.isCreditMakeup && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                    수정된 성적 (Adjusted Grade) *
                  </label>
                  <select
                    value={formData.adjustedGrade}
                    onChange={(e) => setFormData({ ...formData, adjustedGrade: e.target.value })}
                    className="w-full text-xs border border-amber-300 rounded-lg p-2 bg-white font-mono font-bold text-amber-900"
                  >
                    {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                    보정 사유 (Reason)
                  </label>
                  <input
                    type="text"
                    value={formData.makeupReason}
                    onChange={(e) => setFormData({ ...formData, makeupReason: e.target.value })}
                    placeholder="예: Summer School 재수강"
                    className="w-full text-xs border border-amber-300 rounded-lg p-2 bg-white text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? "삭제 중..." : "과목 삭제"}</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition shadow-md flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>저장 및 GPA 재계산 중...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>저장 및 GPA 재계산</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
