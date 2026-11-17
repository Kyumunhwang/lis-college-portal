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
  "New TOEFL iBT",
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
  const [selectedType, setSelectedType] = useState("New TOEFL iBT");
  const [customTestName, setCustomTestName] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [testDate, setTestDate] = useState("");
  const [sectionScoresJson, setSectionScoresJson] = useState("");
  const [notes, setNotes] = useState("");

  // New TOEFL iBT & Classic TOEFL Section States
  const [toeflReading, setToeflReading] = useState("");
  const [toeflListening, setToeflListening] = useState("");
  const [toeflWriting, setToeflWriting] = useState("");
  const [toeflSpeaking, setToeflSpeaking] = useState("");
  const [toeflConcordance120, setToeflConcordance120] = useState("");
  const [isMyBest, setIsMyBest] = useState(false);
  const [isManualSectionEdit, setIsManualSectionEdit] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCustom = selectedType === "CUSTOM";
  const isAp = selectedType.startsWith("AP ");
  const isNewToefl = selectedType === "New TOEFL iBT";
  const isClassicToefl = selectedType === "TOEFL iBT";

  // CEFR Grade mapping for New TOEFL iBT (1-6 scale)
  const getCefrBadge = (scoreNum: number) => {
    if (scoreNum >= 6.0) return { level: "C2", label: "C2 (Mastery / Near-native)", color: "bg-purple-100 text-purple-800 border-purple-200" };
    if (scoreNum >= 5.0) return { level: "C1", label: "C1 (Advanced)", color: "bg-blue-100 text-blue-800 border-blue-200" };
    if (scoreNum >= 4.0) return { level: "B2", label: "B2 (Upper-Intermediate)", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    if (scoreNum >= 3.0) return { level: "B1", label: "B1 (Intermediate)", color: "bg-amber-100 text-amber-800 border-amber-200" };
    return { level: "A2/A1", label: "A2/A1 (Basic)", color: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  // Sync New TOEFL scores
  const handleNewToeflChange = (field: "R" | "L" | "W" | "S" | "CONC", val: string) => {
    const newR = field === "R" ? val : toeflReading;
    const newL = field === "L" ? val : toeflListening;
    const newW = field === "W" ? val : toeflWriting;
    const newS = field === "S" ? val : toeflSpeaking;
    const newConc = field === "CONC" ? val : toeflConcordance120;

    if (field === "R") setToeflReading(val);
    if (field === "L") setToeflListening(val);
    if (field === "W") setToeflWriting(val);
    if (field === "S") setToeflSpeaking(val);
    if (field === "CONC") setToeflConcordance120(val);

    const nums = [parseFloat(newR), parseFloat(newL), parseFloat(newW), parseFloat(newS)].filter(
      (n) => !isNaN(n)
    );

    if (nums.length > 0) {
      // ETS rule: overall score is the average of all 4 section scores, rounded to the nearest half band
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      const roundedHalf = Math.round(avg * 2) / 2;
      setTotalScore(roundedHalf.toFixed(1));

      if (!isManualSectionEdit) {
        const parts: string[] = [];
        if (newR) parts.push(`Reading: ${parseFloat(newR).toFixed(1)}/6`);
        if (newL) parts.push(`Listening: ${parseFloat(newL).toFixed(1)}/6`);
        if (newW) parts.push(`Writing: ${parseFloat(newW).toFixed(1)}/6`);
        if (newS) parts.push(`Speaking: ${parseFloat(newS).toFixed(1)}/6`);

        const cefr = getCefrBadge(roundedHalf).level;
        let summary = `${parts.join(", ")} | CEFR: ${cefr}`;
        if (newConc.trim()) {
          summary += ` (환산: ${newConc.trim()}/120)`;
        }
        setSectionScoresJson(summary);
      }
    }
  };

  // Sync Classic TOEFL scores
  const handleClassicToeflChange = (field: "R" | "L" | "W" | "S", val: string) => {
    const newR = field === "R" ? val : toeflReading;
    const newL = field === "L" ? val : toeflListening;
    const newW = field === "W" ? val : toeflWriting;
    const newS = field === "S" ? val : toeflSpeaking;

    if (field === "R") setToeflReading(val);
    if (field === "L") setToeflListening(val);
    if (field === "W") setToeflWriting(val);
    if (field === "S") setToeflSpeaking(val);

    const nums = [parseInt(newR, 10), parseInt(newL, 10), parseInt(newW, 10), parseInt(newS, 10)].filter(
      (n) => !isNaN(n)
    );

    if (nums.length > 0) {
      const sum = nums.reduce((a, b) => a + b, 0);
      setTotalScore(sum.toString());

      if (!isManualSectionEdit) {
        const parts: string[] = [];
        if (newR) parts.push(`R: ${newR}`);
        if (newL) parts.push(`L: ${newL}`);
        if (newS) parts.push(`S: ${newS}`);
        if (newW) parts.push(`W: ${newW}`);
        setSectionScoresJson(parts.join(", "));
      }
    }
  };

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    setTotalScore("");
    setSectionScoresJson("");
    setToeflReading("");
    setToeflListening("");
    setToeflWriting("");
    setToeflSpeaking("");
    setToeflConcordance120("");
  };

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

    let finalNotes = notes.trim();
    if (isMyBest && !finalNotes.includes("MyBest")) {
      finalNotes = finalNotes ? `[MyBest Scores] ${finalNotes}` : "[MyBest Scores]";
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
          notes: finalNotes || null,
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
    if (isNewToefl) return "New TOEFL Band: 1.0 ~ 6.0 (예: 6.0)";
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
                onChange={(e) => handleTypeChange(e.target.value)}
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

          {/* ======================================================== */}
          {/* SPECIALIZED FORM: NEW TOEFL iBT (2026 1-6 Band Scale)    */}
          {/* ======================================================== */}
          {isNewToefl && (
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3.5">
              <div className="flex items-center justify-between border-b border-purple-200/80 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span className="text-xs font-bold text-purple-950 font-sans">
                    New TOEFL iBT 성적표 공식 1~6 Band 척도 입력
                  </span>
                </div>
                {totalScore && !isNaN(parseFloat(totalScore)) && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getCefrBadge(parseFloat(totalScore)).color}`}>
                    {getCefrBadge(parseFloat(totalScore)).label}
                  </span>
                )}
              </div>

              {/* 4 Section Scores Grid */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  4대 영역별 성적 (각 1.0 ~ 6.0 Band, 0.5 단위) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">📖 Reading</span>
                    <select
                      value={toeflReading}
                      onChange={(e) => handleNewToeflChange("R", e.target.value)}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">선택</option>
                      {["6.0", "5.5", "5.0", "4.5", "4.0", "3.5", "3.0", "2.5", "2.0", "1.5", "1.0"].map((b) => (
                        <option key={b} value={b}>{b} of 6</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">🎧 Listening</span>
                    <select
                      value={toeflListening}
                      onChange={(e) => handleNewToeflChange("L", e.target.value)}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">선택</option>
                      {["6.0", "5.5", "5.0", "4.5", "4.0", "3.5", "3.0", "2.5", "2.0", "1.5", "1.0"].map((b) => (
                        <option key={b} value={b}>{b} of 6</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">✍️ Writing</span>
                    <select
                      value={toeflWriting}
                      onChange={(e) => handleNewToeflChange("W", e.target.value)}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">선택</option>
                      {["6.0", "5.5", "5.0", "4.5", "4.0", "3.5", "3.0", "2.5", "2.0", "1.5", "1.0"].map((b) => (
                        <option key={b} value={b}>{b} of 6</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">🎙️ Speaking</span>
                    <select
                      value={toeflSpeaking}
                      onChange={(e) => handleNewToeflChange("S", e.target.value)}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">선택</option>
                      {["6.0", "5.5", "5.0", "4.5", "4.0", "3.5", "3.0", "2.5", "2.0", "1.5", "1.0"].map((b) => (
                        <option key={b} value={b}>{b} of 6</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-purple-700 mt-1">
                  * 4대 영역을 선택하면 ETS 공식 규칙(평균 반올림)에 따라 Overall Band Score가 자동 산출됩니다.
                </p>
              </div>

              {/* Concordance 120 Scale Score & MyBest Check */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-200/60">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    기존 120점 환산점수 (선택 / 성적표 병기값)
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      placeholder="예: 118"
                      value={toeflConcordance120}
                      onChange={(e) => handleNewToeflChange("CONC", e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                    />
                    <span className="text-xs text-slate-500 shrink-0">/ 120</span>
                  </div>
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMyBest}
                      onChange={(e) => setIsMyBest(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      MyBest® Scores (최고 성적 조합)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SPECIALIZED FORM: CLASSIC TOEFL iBT (0-120 Scale)       */}
          {/* ======================================================== */}
          {isClassicToefl && (
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                <span className="text-xs font-bold text-blue-950 font-sans">
                  기존 TOEFL iBT 4대 영역별 점수 입력 (각 0~30점)
                </span>
                <span className="text-[11px] text-blue-700 font-semibold font-mono">
                  총점 120점 만점 자동 합산
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">Reading (0~30)</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    placeholder="예: 28"
                    value={toeflReading}
                    onChange={(e) => handleClassicToeflChange("R", e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2 bg-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">Listening (0~30)</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    placeholder="예: 29"
                    value={toeflListening}
                    onChange={(e) => handleClassicToeflChange("L", e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2 bg-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">Writing (0~30)</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    placeholder="예: 28"
                    value={toeflWriting}
                    onChange={(e) => handleClassicToeflChange("W", e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2 bg-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-600 block mb-0.5">Speaking (0~30)</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    placeholder="예: 27"
                    value={toeflSpeaking}
                    onChange={(e) => handleClassicToeflChange("S", e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Overall Score & Test Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isNewToefl ? "Overall Band Score *" : "총점 / 획득 점수 (Score) *"}
                </label>
                {isNewToefl && (
                  <span className="text-[10px] text-purple-700 font-bold">1.0 ~ 6.0</span>
                )}
              </div>
              <input
                type="number"
                step="any"
                required
                placeholder={getScorePlaceholder()}
                value={totalScore}
                onChange={(e) => setTotalScore(e.target.value)}
                className={`w-full text-xs border rounded-lg p-2 font-mono font-bold ${
                  isNewToefl
                    ? "border-purple-300 bg-purple-50/20 text-purple-900 text-sm"
                    : "border-slate-300"
                }`}
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                영역별 세부 성적 요약 (Section Scores)
              </label>
              {(isNewToefl || isClassicToefl) && (
                <button
                  type="button"
                  onClick={() => setIsManualSectionEdit(!isManualSectionEdit)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold"
                >
                  {isManualSectionEdit ? "자동 생성으로 되돌리기" : "직접 텍스트 수정"}
                </button>
              )}
            </div>
            <input
              type="text"
              readOnly={(isNewToefl || isClassicToefl) && !isManualSectionEdit}
              placeholder={
                isNewToefl
                  ? "예: Reading: 6.0/6, Listening: 6.0/6, Writing: 6.0/6, Speaking: 6.0/6 | CEFR: C2 (118/120)"
                  : selectedType.includes("SAT")
                  ? "예: Math: 800, EBRW: 720"
                  : selectedType.includes("TOEFL")
                  ? "예: R: 28, L: 29, S: 27, W: 28"
                  : selectedType.includes("ACT")
                  ? "예: E: 35, M: 36, R: 34, S: 35"
                  : "영역별 점수 (선택사항)"
              }
              value={sectionScoresJson}
              onChange={(e) => setSectionScoresJson(e.target.value)}
              className={`w-full text-xs border rounded-lg p-2 font-mono ${
                (isNewToefl || isClassicToefl) && !isManualSectionEdit
                  ? "bg-slate-100 text-slate-600 border-slate-200"
                  : "bg-white border-slate-300"
              }`}
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
