"use client";

import { useState, useEffect } from "react";
import {
  X,
  Edit3,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  ListTodo,
} from "lucide-react";

interface ActionItem {
  id: string;
  task: string;
  done: boolean;
}

export interface CounselingLogData {
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
  counselor?: { name: string; email: string };
}

interface EditCounselingModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: CounselingLogData;
  studentId: string;
  onSuccess: () => void;
}

const COUNSELING_CATEGORIES = [
  "정기진학상담",
  "대학목표선정",
  "GPA/학업관리",
  "비교과/활동",
  "공인시험(SAT/TOEFL)",
  "에세이/원서작성",
  "학부모상담",
  "진로/전공탐색",
  "기타",
];

export function EditCounselingModal({
  isOpen,
  onClose,
  log,
  studentId,
  onSuccess,
}: EditCounselingModalProps) {
  const [title, setTitle] = useState(log.title);
  const [category, setCategory] = useState(log.category || "정기진학상담");
  const [counselDate, setCounselDate] = useState(
    log.counselDate ? new Date(log.counselDate).toISOString().slice(0, 10) : ""
  );
  const [withParent, setWithParent] = useState(log.withParent);
  const [status, setStatus] = useState(log.status || "SCHEDULED");
  const [isUrgent, setIsUrgent] = useState(log.isUrgent);
  const [nextCounselDate, setNextCounselDate] = useState(
    log.nextCounselDate ? new Date(log.nextCounselDate).toISOString().slice(0, 10) : ""
  );
  const [content, setContent] = useState(log.content);

  // Action Items state
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [newItemText, setNewItemText] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setTitle(log.title);
    setCategory(log.category || "정기진학상담");
    setCounselDate(
      log.counselDate ? new Date(log.counselDate).toISOString().slice(0, 10) : ""
    );
    setWithParent(log.withParent);
    setStatus(log.status || "SCHEDULED");
    setIsUrgent(log.isUrgent);
    setNextCounselDate(
      log.nextCounselDate ? new Date(log.nextCounselDate).toISOString().slice(0, 10) : ""
    );
    setContent(log.content);

    try {
      if (log.actionItems) {
        const parsed = JSON.parse(log.actionItems);
        setActionItems(Array.isArray(parsed) ? parsed : []);
      } else {
        setActionItems([]);
      }
    } catch {
      setActionItems([]);
    }
  }, [log]);

  if (!isOpen) return null;

  const handleAddActionItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ActionItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      task: newItemText.trim(),
      done: false,
    };
    setActionItems([...actionItems, newItem]);
    setNewItemText("");
  };

  const handleToggleItemDone = (id: string) => {
    setActionItems(
      actionItems.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    setActionItems(actionItems.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMessage("상담 안건(제목)과 상세 내용을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/students/${studentId}/counseling`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: log.id,
          title: title.trim(),
          category,
          counselDate: counselDate ? new Date(counselDate).toISOString() : new Date().toISOString(),
          withParent,
          status,
          isUrgent,
          nextCounselDate: nextCounselDate ? new Date(nextCounselDate).toISOString() : null,
          content: content.trim(),
          actionItems,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "상담 기록 수정에 실패했습니다.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Edit3 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold">1:1 진학상담 기록 수정</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                상담 이후 발생한 추가 변동사항, 후속 과제 및 상태를 업데이트합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Date, Category, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                상담 일시 *
              </label>
              <input
                type="date"
                value={counselDate}
                onChange={(e) => setCounselDate(e.target.value)}
                required
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                상담 카테고리 *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white focus:ring-2 focus:ring-blue-500"
              >
                {COUNSELING_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                상담 진행 상태 *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full text-xs border rounded-lg p-2 font-bold ${
                  status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}
              >
                <option value="SCHEDULED">상담 전 (SCHEDULED)</option>
                <option value="COMPLETED">상담 완료 (COMPLETED)</option>
              </select>
            </div>
          </div>

          {/* Options Row: withParent, isUrgent */}
          <div className="flex flex-wrap items-center gap-4 px-1">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={withParent}
                onChange={(e) => setWithParent(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>학부모 동석 상담</span>
              </span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-rose-700 font-semibold">긴급 / 집중 관리 안건</span>
              </span>
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              상담 안건 및 제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 11학년 1학기 수시 진학 전략 및 AP 시험 준비 점검"
              required
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              상담 상세 내용 및 추가 변동사항 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="상담 나눈 핵심 대화, 학생의 진로 희망, 학부모 의견, 상담 이후 발생한 추가 변동사항 등을 자세히 기록하세요."
              required
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Next Action Items Manager */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <ListTodo className="w-4 h-4 text-blue-600" />
                <span>후속 실행 과제 (Action Items)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                총 {actionItems.length}개 ({actionItems.filter((i) => i.done).length}개 완료)
              </span>
            </div>

            {/* Input to add new action item */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddActionItem();
                  }
                }}
                placeholder="새 후속 과제 입력 후 엔터 또는 추가..."
                className="flex-1 text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddActionItem}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>추가</span>
              </button>
            </div>

            {/* List of items */}
            {actionItems.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/90 text-xs"
                  >
                    <label className="flex items-center space-x-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleItemDone(item.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span
                        className={`${
                          item.done ? "line-through text-slate-400 font-normal" : "text-slate-800 font-medium"
                        }`}
                      >
                        {item.task}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-slate-300 hover:text-rose-600 transition p-1"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Counsel Schedule */}
          <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">다음 상담 일정 예약</span>
                <span className="text-[10px] text-slate-500">후속 상담 일정을 미리 캘린더에 예약합니다.</span>
              </div>
            </div>
            <input
              type="date"
              value={nextCounselDate}
              onChange={(e) => setNextCounselDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "수정사항 저장 중..." : "상담 수정사항 저장"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
