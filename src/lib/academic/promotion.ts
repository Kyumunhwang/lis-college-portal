import { prisma } from "@/lib/prisma";

export interface PromotionResult {
  studentId: string;
  previousGradeLevel: number;
  newGradeLevel: number;
  previousStatus: string;
  newStatus: string;
  graduationYear?: number | null;
  promoted: boolean;
  reason: string;
}

/**
 * 미국 커리큘럼 기반 학년 자동 진급 및 졸업 평가 엔진
 * -------------------------------------------------------------
 * - 1st Semester (Fall / 가을학기): 해당 학년도 진행 중 -> 학년 유지
 * - 2nd Semester (Spring / 봄학기): 성적이 업데이트되면 해당 학년 과정 완료 -> 다음 학년으로 자동 진급!
 *   * Grade 9 봄학기(Semester 2) 성적 완료 -> Grade 10으로 자동 진급
 *   * Grade 10 봄학기(Semester 2) 성적 완료 -> Grade 11로 자동 진급
 *   * Grade 11 봄학기(Semester 2) 성적 완료 -> Grade 12로 자동 진급
 *   * Grade 12 봄학기(Semester 2) 성적 완료 -> 고교 전 과정 수료로 🎓 졸업(GRADUATED, Class of SpringYear)
 */
export async function evaluateAndApplyPromotion(studentId: string): Promise<PromotionResult | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      semesterRecords: {
        include: {
          courses: true,
        },
      },
    },
  });

  if (!student) return null;

  // 전출생(WITHDRAWAL)인 경우 전출 상태 유지
  if (student.status === "WITHDRAWAL" || student.withdrawalDate) {
    return {
      studentId: student.id,
      previousGradeLevel: student.gradeLevel,
      newGradeLevel: student.gradeLevel,
      previousStatus: student.status,
      newStatus: "WITHDRAWAL",
      promoted: false,
      reason: "전출생은 학적 상태(WITHDRAWAL)를 보존합니다.",
    };
  }

  // 학기 기록이 없는 경우 패스
  if (student.semesterRecords.length === 0) {
    return null;
  }

  // 연도 파싱 헬퍼 ("2024-2025" -> startYear: 2024, endYear: 2025)
  const parseAcademicYear = (ay: string) => {
    const match = ay.match(/(\d{4})-(\d{4})/);
    return match
      ? { startYear: parseInt(match[1], 10), endYear: parseInt(match[2], 10) }
      : { startYear: 0, endYear: 0 };
  };

  // 학기 순서 헬퍼: Fall(1) < Winter(2) < Spring(3) < Summer(4)
  const getTermOrder = (termName: string) => {
    const t = termName.toLowerCase();
    if (t.includes("semester 1") || t.includes("fall")) return 1;
    if (t.includes("winter")) return 2;
    if (t.includes("semester 2") || t.includes("spring")) return 3;
    if (t.includes("summer")) return 4;
    return 1;
  };

  // 등록된 과목이 있는 학기들을 시계열 순서로 정렬
  const validSemesters = student.semesterRecords
    .filter((s) => s.courses.length > 0)
    .sort((a, b) => {
      const yearA = parseAcademicYear(a.academicYear).startYear;
      const yearB = parseAcademicYear(b.academicYear).startYear;
      if (yearA !== yearB) return yearA - yearB;
      return getTermOrder(a.termName) - getTermOrder(b.termName);
    });

  if (validSemesters.length === 0) {
    return null;
  }

  // 최신 봄학기(Semester 2)와 최신 가을학기(Semester 1) 확인
  const sem2List = validSemesters.filter(
    (s) => s.termName.includes("Semester 2") || s.termName.includes("Spring")
  );
  const sem1List = validSemesters.filter(
    (s) => s.termName.includes("Semester 1") || s.termName.includes("Fall")
  );

  const latestSem2 = sem2List.length > 0 ? sem2List[sem2List.length - 1] : null;
  const latestSem1 = sem1List.length > 0 ? sem1List[sem1List.length - 1] : null;

  let newGrade = student.gradeLevel;
  let newStatus = student.status;
  let newGradYear = student.graduationYear;
  let promoted = false;
  let reason = "";

  if (latestSem2) {
    const sem2Year = parseAcademicYear(latestSem2.academicYear).startYear;
    const sem1Year = latestSem1 ? parseAcademicYear(latestSem1.academicYear).startYear : -1;

    // 봄학기(Semester 2)가 최신이거나, 같은 학년도인 경우 -> 봄학기 성적이 완료되었으므로 진급!
    if (sem2Year >= sem1Year) {
      if (latestSem2.gradeLevel >= 12) {
        // 12학년 봄학기 성적 완료 -> 고등학교 졸업
        newGrade = 12;
        newStatus = "GRADUATED";
        newGradYear = parseAcademicYear(latestSem2.academicYear).endYear;
        promoted = true;
        reason = `${latestSem2.academicYear} ${latestSem2.termName} (Grade 12 봄학기) 완료 ➔ 🎓 졸업 (Class of ${newGradYear})`;
      } else {
        // 9 -> 10, 10 -> 11, 11 -> 12 자동 진급
        newGrade = Math.min(12, latestSem2.gradeLevel + 1);
        newStatus = "ENROLLED";
        promoted = true;
        reason = `${latestSem2.academicYear} ${latestSem2.termName} (Grade ${latestSem2.gradeLevel} 봄학기) 성적 완료 ➔ Grade ${newGrade}로 자동 진급`;
      }
    } else {
      // Semester 1(새 학년도 가을학기)이 더 최신인 경우: 다음 학년의 가을학기 진행 중
      newGrade = latestSem1 ? latestSem1.gradeLevel : student.gradeLevel;
      newStatus = "ENROLLED";
      reason = `${latestSem1?.academicYear} ${latestSem1?.termName} (가을학기) 진행 중으로 Grade ${newGrade} 유지`;
    }
  } else if (latestSem1) {
    // 봄학기 없이 가을학기만 완료된 경우 -> 해당 가을학기 학년 유지
    newGrade = latestSem1.gradeLevel;
    newStatus = "ENROLLED";
    reason = `${latestSem1.academicYear} ${latestSem1.termName} (가을학기) 성적 반영으로 Grade ${newGrade} 유지`;
  }

  // 조기졸업 예외 보호: 1017 등 이미 조기졸업으로 확정된 학생이 7학기로 졸업한 경우 보존
  if (student.status === "GRADUATED" && student.graduationYear && newStatus !== "GRADUATED") {
    // 수동으로 졸업 처리된 상태 유지
    newStatus = "GRADUATED";
    newGrade = 12;
    newGradYear = student.graduationYear;
  }

  // DB 업데이트
  await prisma.student.update({
    where: { id: studentId },
    data: {
      gradeLevel: newGrade,
      status: newStatus,
      graduationYear: newGradYear,
      graduationDate:
        newStatus === "GRADUATED" && newGradYear
          ? new Date(`${newGradYear}-06-10`)
          : student.graduationDate,
    },
  });

  return {
    studentId,
    previousGradeLevel: student.gradeLevel,
    newGradeLevel: newGrade,
    previousStatus: student.status,
    newStatus,
    graduationYear: newGradYear,
    promoted,
    reason,
  };
}

/**
 * 모든 학생을 대상으로 미국 커리큘럼 봄학기 진급 규칙 일괄 검사 및 적용
 */
export async function applyPromotionToAllStudents() {
  const students = await prisma.student.findMany({ select: { id: true, studentCode: true, nameEn: true } });
  const results: PromotionResult[] = [];

  for (const s of students) {
    const res = await evaluateAndApplyPromotion(s.id);
    if (res && res.promoted) {
      results.push(res);
    }
  }

  return results;
}
