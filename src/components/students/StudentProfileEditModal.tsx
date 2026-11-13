"use client";

import { useState } from "react";
import { X, Save, RefreshCw, UserCheck } from "lucide-react";

interface StudentProfileData {
  id: string;
  studentCode: string;
  nameEn: string;
  nameKo: string | null;
  gradeLevel: number;
  status: string;
  graduationYear?: number | null;
  graduationDate: string | null;
  withdrawalDate: string | null;
  entryDate: string | null;
  birthDate: string | null;
  gender: string | null;
  parentName: string | null;
  parentContact: string | null;
  address: string | null;
}

interface StudentProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfileData;
  onSuccess: () => void;
}

export function StudentProfileEditModal({
  isOpen,
  onClose,
  student,
  onSuccess,
}: StudentProfileEditModalProps) {
  const [formData, setFormData] = useState({
    nameEn: student.nameEn,
    nameKo: student.nameKo || "",
    gradeLevel: student.gradeLevel,
    status: student.status,
    graduationYear: student.graduationYear ? student.graduationYear.toString() : "2026",
    graduationDate: student.graduationDate ? student.graduationDate.slice(0, 10) : "",
    withdrawalDate: student.withdrawalDate ? student.withdrawalDate.slice(0, 10) : "",
    entryDate: student.entryDate ? student.entryDate.slice(0, 10) : "",
    birthDate: student.birthDate ? student.birthDate.slice(0, 10) : "",
    gender: student.gender || "M",
    parentName: student.parentName || "",
    parentContact: student.parentContact || "",
    address: student.address || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn: formData.nameEn,
          nameKo: formData.nameKo,
          gradeLevel: formData.gradeLevel,
          status: formData.status,
          graduationYear: formData.status === "GRADUATED" ? parseInt(formData.graduationYear, 10) : null,
          graduationDate: formData.graduationDate || null,
          withdrawalDate: formData.withdrawalDate || null,
          entryDate: formData.entryDate || null,
          birthDate: formData.birthDate || null,
          gender: formData.gender,
          parentName: formData.parentName,
          parentContact: formData.parentContact,
          address: formData.address,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "수정에 실패했습니다.");
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold">학생 학적 및 기본 정보 수정</h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                대상 학생: {student.nameEn} {student.nameKo ? `(${student.nameKo})` : ""} • 학번: {student.studentCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Academic Status & Grade Level */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
            <div className="text-xs font-bold text-blue-900 flex items-center">
              <span>학적 상태 및 졸업 정보 (핵심)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  재학 상태 (Status) *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="ENROLLED">재학 (ENROLLED)</option>
                  <option value="GRADUATED">🎓 졸업 (GRADUATED)</option>
                  <option value="WITHDRAWAL">전출 (WITHDRAWAL)</option>
                  <option value="LEAVE_OF_ABSENCE">휴학 (LEAVE)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  현재 학년 (Grade) *
                </label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: parseInt(e.target.value, 10) })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value={12}>Grade 12 (12학년)</option>
                  <option value={11}>Grade 11 (11학년)</option>
                  <option value={10}>Grade 10 (10학년)</option>
                  <option value={9}>Grade 9 (9학년)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  졸업 연도 (Class of)
                </label>
                <select
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  disabled={formData.status !== "GRADUATED"}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 font-medium disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="2026">2026년도 (Class of 2026)</option>
                  <option value="2025">2025년도 (Class of 2025)</option>
                  <option value="2024">2024년도 (Class of 2024)</option>
                  <option value="2023">2023년도 (Class of 2023)</option>
                  <option value="2027">2027년도 (Class of 2027)</option>
                  <option value="2028">2028년도 (Class of 2028)</option>
                  <option value="2029">2029년도 (Class of 2029)</option>
                </select>
              </div>
            </div>

            {formData.status === "GRADUATED" && (
              <div className="text-[11px] text-blue-700">
                * 조기졸업 및 정규졸업 학생은 상태를 &apos;졸업&apos;으로 지정 시 [졸업생 관리] 메뉴에 자동 분류됩니다.
              </div>
            )}
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                영문 이름 (Name EN) *
              </label>
              <input
                type="text"
                required
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                placeholder="예: Gaeun LIM"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                한글 이름 (Name KO)
              </label>
              <input
                type="text"
                value={formData.nameKo}
                onChange={(e) => setFormData({ ...formData, nameKo: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                placeholder="예: 임가은"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                생년월일 (Birth Date)
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                입학일 (Entry Date)
              </label>
              <input
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                졸업일 (Graduation Date)
              </label>
              <input
                type="date"
                value={formData.graduationDate}
                onChange={(e) => setFormData({ ...formData, graduationDate: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Gender & Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                성별 (Gender)
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="M">남성 (M)</option>
                <option value="F">여성 (F)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학부모 성명
              </label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학부모 연락처
              </label>
              <input
                type="text"
                value={formData.parentContact}
                onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                placeholder="010-0000-0000"
              />
            </div>
          </div>

          {/* Footer buttons */}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition shadow-md flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>학적 정보 저장</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
