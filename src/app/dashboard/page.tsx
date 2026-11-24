import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { CounselingDashboardView } from "@/components/dashboard/CounselingDashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const isViewer = session?.role === "VIEWER";

  const [logs, studentsCount, totalUniversities, gpaAggregate] = await Promise.all([
    isViewer
      ? Promise.resolve([])
      : prisma.counselingLog.findMany({
          orderBy: [
            { isUrgent: "desc" },
            { nextCounselDate: "asc" },
            { counselDate: "desc" },
          ],
          include: {
            student: {
              select: {
                id: true,
                studentCode: true,
                nameEn: true,
                nameKo: true,
                gradeLevel: true,
                status: true,
                cumulativeGpa: true,
                coreCumulativeGpa: true,
              },
            },
            counselor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
    prisma.student.count(),
    prisma.targetUniversity.count(),
    prisma.student.aggregate({
      _avg: {
        cumulativeGpa: true,
      },
    }),
  ]);

  const avgGpa = gpaAggregate._avg.cumulativeGpa
    ? gpaAggregate._avg.cumulativeGpa.toFixed(2)
    : "0.00";

  // Dates to ISO string for Client Component hydration and sort:
  // 1순위: 다음 상담일정(nextCounselDate)이 빠른 순 (먼저 상담해야 하는 일정 최상단)
  // 2순위: 최근 상담한 일자(counselDate) 내림차순
  const serializedLogs = logs
    .map((l) => ({
      id: l.id,
      studentId: l.studentId,
      counselDate: l.counselDate.toISOString(),
      category: l.category,
      withParent: l.withParent,
      title: l.title,
      content: l.content,
      actionItems: l.actionItems,
      status: l.status,
      isUrgent: l.isUrgent,
      nextCounselDate: l.nextCounselDate ? l.nextCounselDate.toISOString() : null,
      createdAt: l.createdAt.toISOString(),
      counselor: l.counselor,
      student: l.student,
    }))
    .sort((a, b) => {
      const aHasNext = Boolean(a.nextCounselDate);
      const bHasNext = Boolean(b.nextCounselDate);

      // 1. 다음 상담일정이 있는 건 최우선
      if (aHasNext && !bHasNext) return -1;
      if (!aHasNext && bHasNext) return 1;

      // 2. 둘 다 다음 상담일정이 있으면 가장 빠른 날짜 순(오름차순)
      if (aHasNext && bHasNext && a.nextCounselDate && b.nextCounselDate) {
        const diffNext =
          new Date(a.nextCounselDate).getTime() - new Date(b.nextCounselDate).getTime();
        if (diffNext !== 0) return diffNext;
      }

      // 3. 둘 다 다음 일정이 없거나 동일하면 최근 상담일자 내림차순
      const diffCounsel =
        new Date(b.counselDate).getTime() - new Date(a.counselDate).getTime();
      if (diffCounsel !== 0) return diffCounsel;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <CounselingDashboardView
      initialLogs={serializedLogs}
      totalStudents={studentsCount}
      avgGpa={avgGpa}
      totalUniversities={totalUniversities}
      userRole={session?.role}
    />
  );
}
