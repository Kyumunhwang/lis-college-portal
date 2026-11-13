"use client";

import { useState } from "react";
import { X, Award, Plus, RefreshCw } from "lucide-react";

interface AddAwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onSuccess: () => void;
}

export function AddAwardModal({
  isOpen,
  onClose,
  studentId,
  onSuccess,
}: AddAwardModalProps) {
  const [awardTitle, setAwardTitle] = useState("");
  const [awardType, setAwardType] = useState("INTERNAL");
  const [awardDate, setAwardDate] = useState("");
  const [issuer, setIssuer] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/students/${studentId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "AWARD",
          awardTitle: awardTitle.trim(),
          awardType,
          awardDate: awardDate || null,
          issuer: issuer.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "수상 내역 등록에 실패했습니다.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold">교내외 수상 내역 (Award) 추가</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">상장 / 수상 명칭 (Award Title) *</label>
            <input
              type="text"
              required
              placeholder="예: Academic Excellence Award, AMC 12 Distinction"
              value={awardTitle}
              onChange={(e) => setAwardTitle(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">수상 구분 (Type) *</label>
              <select
                value={awardType}
                onChange={(e) => setAwardType(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
              >
                <option value="INTERNAL">교내 수상 (Internal)</option>
                <option value="EXTERNAL">교외/국제 대회 (External)</option>
                <option value="NATIONAL">전국/공인 대회 (National)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">수상 일자</label>
              <input
                type="date"
                value={awardDate}
                onChange={(e) => setAwardDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">수여 기관 (Issuer)</label>
            <input
              type="text"
              placeholder="예: 등대글로벌스쿨 교장, MAA, 한국모의유엔협회 등"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2"
            />
          </div>

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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow transition flex items-center space-x-1"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>등록 중...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>수상내역 등록</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
