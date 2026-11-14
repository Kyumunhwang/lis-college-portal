"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Layers,
  Sparkles,
} from "lucide-react";

interface UploadResultItem {
  filename: string;
  studentCode: string;
  nameEn: string;
  status: string;
  error?: string;
}

export default function TranscriptParserPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadReport, setUploadReport] = useState<{
    total: number;
    success: number;
    failed: number;
    results: UploadResultItem[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const pdfFiles = Array.from(files).filter((f) =>
      f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfFiles.length === 0) {
      setErrorMessage("업로드할 .pdf 파일이 없습니다. PDF 성적표 파일을 선택해주세요.");
      return;
    }
    setSelectedFiles(pdfFiles);
    setUploadReport(null);
    setErrorMessage(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleUploadAndParse = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage("업로드할 성적표 PDF 파일을 선택해주세요.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setErrorMessage(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setUploadProgress(45);
      const res = await fetch("/api/transcript/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (res.ok) {
        setUploadReport({
          total: data.totalFiles,
          success: data.successCount,
          failed: data.failedCount,
          results: data.results || [],
        });
        setUploadProgress(100);
      } else {
        setErrorMessage(data.error || "성적표 일괄 파싱에 실패했습니다.");
      }
    } catch {
      setErrorMessage("네트워크 통신 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <FileCheck2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-sans">
                Transcript PDF 파싱 (Gradelink Official Transcript Batch Parser)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Gradelink 공식 성적표 PDF 파일 일괄 업로드, Gemini AI 인적사항 및 학기별 성적 자동 파싱 & DB 동기화
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/gpa-analytics"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1.5 transition"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>학생별 GPA 분석 바로가기</span>
          </Link>
        </div>
      </div>

      {/* 2. Upload Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Gradelink 성적표 PDF 파일 업로드 & 배치 파싱</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            학생들의 성적표 PDF 파일을 다중 선택하거나 박스 안에 드래그 앤 드롭하세요 (최대 50개 동시 지원).<br />
            파일명 규칙(`학번 - 영문이름.pdf`) 및 Gemini 멀티모달 파서가 과목명, 취득 학점, Unweighted 성적 및 학기 구조를 정밀 인식합니다.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          <div className="w-14 h-14 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              클릭하여 PDF 성적표 파일을 선택하거나 여기로 드래그하세요
            </p>
            <p className="text-xs text-slate-400 mt-1">
              .pdf 형식의 공식 성적표 파일 지원 (다중 파일 일괄 업로드 가능)
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="pt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                선택된 파일: {selectedFiles.length}개
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              총 {selectedFiles.length}개 성적표 준비 완료
            </span>
            <button
              onClick={handleUploadAndParse}
              disabled={isUploading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 flex items-center space-x-2 transition cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini AI 파싱 및 DB 반영 중... ({uploadProgress}%)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>선택한 {selectedFiles.length}개 성적표 일괄 파싱 시작</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {isUploading && (
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Report Card */}
        {uploadReport && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  성적표 배치 파싱 처리 결과
                </h3>
              </div>
              <div className="text-xs space-x-2">
                <span className="font-semibold text-slate-600">
                  총 {uploadReport.total}개 파일 중
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {uploadReport.success}개 성공
                </span>
                {uploadReport.failed > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                    {uploadReport.failed}개 실패
                  </span>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 text-xs">
              {uploadReport.results.map((r, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-800 truncate text-[11px]">
                      {r.filename}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    {r.status === "SUCCESS" ? (
                      <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✔ [{r.studentCode}] {r.nameEn} 반영 완료
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        ❌ {r.error || "파싱 실패"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href="/gpa-analytics"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 shadow"
              >
                <span>학생별 GPA 분석 및 상세 성적 확인</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
