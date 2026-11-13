"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  Search,
  Shield,
  ShieldCheck,
  Eye,
  AlertTriangle,
  X,
  Check,
  RefreshCw,
} from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "COUNSELOR" | "VIEWER";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Add teacher form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "COUNSELOR" | "VIEWER">("COUNSELOR");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/teachers");
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail, role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create teacher");
        setIsSubmitting(false);
        return;
      }

      setFormSuccess("교사 계정이 성공적으로 등록되었습니다. 초기 비밀번호는 1234입니다.");
      setNewName("");
      setNewEmail("");
      setNewRole("COUNSELOR");
      fetchTeachers();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess("");
      }, 1500);
    } catch {
      setFormError("Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedTeacher) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/teachers/${selectedTeacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password" }),
      });
      if (res.ok) {
        fetchTeachers();
        setIsResetModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/teachers/${selectedTeacher.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTeachers();
        setIsDeleteModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete teacher");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || t.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3.5 h-3.5 mr-1 text-purple-600" /> Admin (관리자)
          </span>
        );
      case "COUNSELOR":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Counselor (상담교사)
          </span>
        );
      case "VIEWER":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" /> Viewer (일반교사)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-sans">
              교사 계정 관리 (Teacher Accounts)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            등대글로벌스쿨 진학상담 시스템에 접근 가능한 교직원 계정 및 권한을 관리합니다.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>새 교사 계정 등록</span>
        </button>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="교사 이름, 이메일 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500">권한 필터:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">전체 권한</option>
              <option value="ADMIN">Admin (관리자)</option>
              <option value="COUNSELOR">Counselor (상담교사)</option>
              <option value="VIEWER">Viewer (일반교사)</option>
            </select>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-5">교사명</th>
                <th className="py-3 px-5">이메일 계정</th>
                <th className="py-3 px-5">부여 권한 (Role)</th>
                <th className="py-3 px-5">비밀번호 상태</th>
                <th className="py-3 px-5">최종 로그인</th>
                <th className="py-3 px-5 text-right">계정 관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    교사 목록을 불러오는 중입니다...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    등록된 교사 계정이 없거나 검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      {teacher.name}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-600">
                      {teacher.email}
                    </td>
                    <td className="py-3.5 px-5">
                      {getRoleBadge(teacher.role)}
                    </td>
                    <td className="py-3.5 px-5">
                      {teacher.mustChangePassword ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          초기비번 (변경 필요)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          설정 완료
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                      {teacher.lastLoginAt
                        ? new Date(teacher.lastLoginAt).toLocaleString("ko-KR")
                        : "기록 없음"}
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setIsResetModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors inline-flex items-center space-x-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>비번 초기화</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setIsDeleteModalOpen(true);
                        }}
                        disabled={teacher.email === "kyumun.hwang@gmail.com"}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-md transition-colors inline-flex items-center space-x-1 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>삭제</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal: 새 교사 등록 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>새 교사 계정 등록</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleAddTeacher} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  교사 성명
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 김상담, 박교과"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  이메일 계정 (로그인 ID)
                </label>
                <input
                  type="email"
                  required
                  placeholder="예: counselor@lis.ac.kr"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  부여 권한 (Role)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["COUNSELOR", "VIEWER", "ADMIN"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewRole(r)}
                      className={`py-2 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                        newRole === r
                          ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {r === "ADMIN" ? "Admin" : r === "COUNSELOR" ? "Counselor" : "Viewer"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 leading-relaxed">
                ℹ️ 계정 등록 시 초기 비밀번호는 <strong>1234</strong>로 자동 설정되며,
                해당 교사의 최초 로그인 시 <strong>비밀번호 변경이 강제</strong>됩니다.
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
                >
                  {isSubmitting ? "등록 중..." : "교사 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: 비밀번호 초기화 컨펌 */}
      {isResetModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              비밀번호를 초기화하시겠습니까?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              <strong>{selectedTeacher.name}</strong> ({selectedTeacher.email}) 교사의 비밀번호가{" "}
              <strong className="text-amber-600">1234</strong>로 재설정되며, 다음 로그인 시 새 비밀번호 설정이 강제됩니다.
            </p>

            <div className="mt-5 flex justify-center space-x-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-all"
              >
                {isSubmitting ? "처리 중..." : "1234로 초기화"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: 계정 삭제 컨펌 (Rose Danger Theme) */}
      {isDeleteModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-rose-200 shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              교사 계정 영구 삭제
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              정말로 <strong>{selectedTeacher.name}</strong> ({selectedTeacher.email}) 교사 계정을 삭제하시겠습니까?
              <br />
              (해당 교사가 작성한 기존 상담 기록은 보존됩니다.)
            </p>

            <div className="mt-5 flex justify-center space-x-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteTeacher}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-rose-600/20"
              >
                {isSubmitting ? "삭제 중..." : "영구 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
