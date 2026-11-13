"use client";

import { useState } from "react";
import { X, BookOpen, Plus, RefreshCw, Edit2 } from "lucide-react";

interface AddTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onSuccess: () => void;
}

// College Board Official AP Courses and Exams (https://apstudents.collegeboard.org/courses)
const AP_COURSES = {
  "Math & Computer Science": [
    "AP Calculus AB",
    "AP Calculus BC",
    "AP Computer Science A",
    "AP Computer Science Principles",
    "AP Precalculus",
    "AP Statistics",
  ],
  "Sciences": [
    "AP Biology",
    "AP Chemistry",
    "AP Environmental Science",
    "AP Physics 1: Algebra-Based",
    "AP Physics 2: Algebra-Based",
    "AP Physics C: Electricity and Magnetism",
    "AP Physics C: Mechanics",
  ],
  "History & Social Sciences": [
    "AP African American Studies",
    "AP Comparative Government and Politics",
    "AP European History",
    "AP Human Geography",
    "AP Macroeconomics",
    "AP Microeconomics",
    "AP Psychology",
    "AP United States Government and Politics",
    "AP United States History",
    "AP World History: Modern",
  ],
  "English": [
    "AP English Language and Composition",
    "AP English Literature and Composition",
  ],
  "World Languages & Cultures": [
    "AP Chinese Language and Culture",
    "AP French Language and Culture",
    "AP German Language and Culture",
    "AP Italian Language and Culture",
    "AP Japanese Language and Culture",
    "AP Latin",
    "AP Spanish Language and Culture",
    "AP Spanish Literature and Culture",
  ],
  "Arts": [
    "AP 2-D Art and Design",
    "AP 3-D Art and Design",
    "AP Art History",
    "AP Drawing",
    "AP Music Theory",
  ],
  "AP Capstone Diploma Program": [
    "AP Research",
    "AP Seminar",
  ],
};

const GENERAL_TESTS = [
  "TOEFL iBT",
  "SAT",
  "ACT",
  "Duolingo English Test (DET)",
  "IELTS",
  "PSAT / NMSQT",
];

export function AddTestModal({
  isOpen,
  onClose,
  studentId,
  onSuccess,
}: AddTestModalProps) {
  const [selectedType, setSelectedType] = useState("TOEFL iBT");
  const [customTestName, setCustomTestName] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [testDate, setTestDate] = useState("");
  const [sectionScoresJson, setSectionScoresJson] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCustom = selectedType === "CUSTOM";
  const isAp = selectedType.startsWith("AP ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const finalTestType = isCustom ? customTestName.trim() : selectedType;

    if (!finalTestType) {
      setErrorMsg("시험 명칭을 입력하거나 선택해주세요.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/students/${studentId}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType: finalTestType,
          totalScore,
          testDate: testDate || null,
          sectionScoresJson: sectionScoresJson.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "시험 성적 등록에 실패했습니다.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScorePlaceholder = () => {
    if (isAp) return "AP 점수: 1 ~ 5 (예: 5)";
    if (selectedType === "SAT") return "SAT 총점: 400 ~ 1600 (예: 1520)";
    if (selectedType === "TOEFL iBT") return "TOEFL 총점: 0 ~ 120 (예: 112)";
    if (selectedType === "ACT") return "ACT 총점: 1 ~ 36 (예: 34)";
    if (selectedType.includes("Duolingo")) return "DET 총점: 10 ~ 160 (예: 140)";
    if (selectedType.includes("IELTS")) return "IELTS Band: 1.0 ~ 9.0 (예: 8.0)";
    return "총점 또는 획득 점수";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold">공인 시험 대표 성적 등록</h2>
              <p className="text-[11px] text-slate-400">
                Official College Board AP Subjects & 공인성적
              </p>
            </div>
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                시험 종류 (Test Type) *
              </label>
              <button
                type="button"
                onClick={() => setSelectedType(isCustom ? "TOEFL iBT" : "CUSTOM")}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isCustom ? "목록에서 선택하기" : "리스트에 없는 시험 직접 입력"}</span>
              </button>
            </div>

            {!isCustom ? (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="주요 공인 영어 및 대입 시험">
                  {GENERAL_TESTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </optgroup>

                {Object.entries(AP_COURSES).map(([groupName, courses]) => (
                  <optgroup key={groupName} label={`College Board AP - ${groupName}`}>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </optgroup>
                ))}

                <optgroup label="기타 / 수동 입력">
                  <option value="CUSTOM">✏️ 직접 입력 (리스트에 없는 시험 수동 입력)</option>
                </optgroup>
              </select>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="시험 또는 AP 과목 명칭 직접 입력 (예: AMC 12, SSAT, Cambridge A-Level 등)"
                  value={customTestName}
                  onChange={(e) => setCustomTestName(e.target.value)}
                  className="w-full text-xs border border-blue-400 ring-2 ring-blue-100 rounded-lg p-2.5 font-medium bg-blue-50/20"
                />
                <p className="text-[11px] text-slate-500">
                  공식 목록에 없는 시험이나 특수 경시대회 명칭을 직접 기재할 수 있습니다.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                총점 / 점수 (Score) *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder={getScorePlaceholder()}
                value={totalScore}
                onChange={(e) => setTotalScore(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
              />
              {isAp && (
                <span className="text-[10px] text-blue-600 block mt-1">
                  * AP 과목은 1점 ~ 5점 기준
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">응시 일자</label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              영역별 세부 점수 (Section Scores)
            </label>
            <input
              type="text"
              placeholder={
                selectedType.includes("SAT")
                  ? "예: Math: 800, EBRW: 720"
                  : selectedType.includes("TOEFL")
                  ? "예: R: 28, L: 29, S: 27, W: 28"
                  : selectedType.includes("ACT")
                  ? "예: E: 35, M: 36, R: 34, S: 35"
                  : "영역별 점수 (선택사항)"
              }
              value={sectionScoresJson}
              onChange={(e) => setSectionScoresJson(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">비고 및 메모 (Notes)</label>
            <input
              type="text"
              placeholder="예: Super Score, MyBest Score, 1차 응시 목표 달성 등"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition flex items-center space-x-1"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>등록 중...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>성적 등록</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
