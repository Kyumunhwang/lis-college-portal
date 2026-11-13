import { prisma } from "@/lib/prisma";
import { CounselingDashboardView } from "@/components/dashboard/CounselingDashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [logs, studentsCount, totalUniversities, gpaAggregate] = await Promise.all([
    prisma.counselingLog.findMany({
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

  // Dates to ISO string for Client Component hydration
  const serializedLogs = logs.map((l) => ({
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
  }));

  return (
    <CounselingDashboardView
      initialLogs={serializedLogs}
      totalStudents={studentsCount}
      avgGpa={avgGpa}
      totalUniversities={totalUniversities}
    />
  );
}
