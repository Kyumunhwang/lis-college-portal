import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seed for Lighthouse College Counseling Portal...");

  // 1. Clean existing data
  await prisma.gradeAuditLog.deleteMany();
  await prisma.courseGrade.deleteMany();
  await prisma.semesterRecord.deleteMany();
  await prisma.standardizedTest.deleteMany();
  await prisma.clubActivity.deleteMany();
  await prisma.awardRecord.deleteMany();
  await prisma.counselingLog.deleteMany();
  await prisma.targetUniversity.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const adminPasswordHash = await bcrypt.hash("emeo1004#", 10);
  const counselorPasswordHash = await bcrypt.hash("1234", 10);
  const viewerPasswordHash = await bcrypt.hash("1234", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "kyumun.hwang@gmail.com",
      passwordHash: adminPasswordHash,
      name: "황규문 (Lead Architect)",
      role: "ADMIN",
      mustChangePassword: false,
      lastLoginAt: new Date(),
    },
  });

  const counselorUser = await prisma.user.create({
    data: {
      email: "ls.counselors@gmail.com",
      passwordHash: counselorPasswordHash,
      name: "김상담 (Head Counselor)",
      role: "COUNSELOR",
      mustChangePassword: true, // Forces password change on first login!
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      email: "teacher@lis.ac.kr",
      passwordHash: viewerPasswordHash,
      name: "박교과 (General Teacher)",
      role: "VIEWER",
      mustChangePassword: false,
    },
  });

  console.log("✅ Users created: Admin, Counselor (mustChangePassword=true), Viewer");

  // 3. Create Sample Student 1: 1017 David Kim
  const student1 = await prisma.student.create({
    data: {
      studentCode: "1017",
      nameEn: "David Kim",
      nameKo: "김등대",
      gradeLevel: 12,
      status: "ENROLLED",
      birthDate: new Date("2007-03-15"),
      gender: "M",
      entryDate: new Date("2021-08-20"),
      graduationDate: new Date("2025-06-10"),
      parentName: "김학부모",
      parentContact: "010-1234-5678",
      address: "경기도 고양시 일산서구",
      cumulativeGpa: 3.882,
      coreCumulativeGpa: 3.921,
      cumulativeCredits: 22.5,
    },
  });

  // Semesters for Student 1
  const sem1 = await prisma.semesterRecord.create({
    data: {
      studentId: student1.id,
      academicYear: "2023-2024",
      termName: "Semester 1",
      gradeLevel: 11,
      termGpa: 3.900,
      termCoreGpa: 3.933,
      termCredits: 6.0,
      reportedTermGpa: 3.90,
      reportedCumGpa: 3.88,
    },
  });

  await prisma.courseGrade.createMany({
    data: [
      {
        semesterRecordId: sem1.id,
        courseCode: "ENG301",
        courseTitle: "AP English Literature",
        category: "ENGLISH",
        credits: 1.0,
        originalGrade: "A",
        originalPercentage: 94.0,
        unweightedGradePoint: 4.0,
        includeInGpa: true,
      },
      {
        semesterRecordId: sem1.id,
        courseCode: "MAT402",
        courseTitle: "AP Calculus BC",
        category: "MATH",
        credits: 1.0,
        originalGrade: "A+",
        originalPercentage: 98.0,
        unweightedGradePoint: 4.0,
        includeInGpa: true,
      },
      {
        semesterRecordId: sem1.id,
        courseCode: "SCI301",
        courseTitle: "AP Physics C: Mechanics",
        category: "SCIENCE",
        credits: 1.0,
        originalGrade: "A",
        originalPercentage: 95.0,
        unweightedGradePoint: 4.0,
        includeInGpa: true,
      },
      {
        semesterRecordId: sem1.id,
        courseCode: "SOC301",
        courseTitle: "AP US History",
        category: "SOCIAL_STUDIES",
        credits: 1.0,
        originalGrade: "A-",
        originalPercentage: 91.0,
        unweightedGradePoint: 3.7,
        includeInGpa: true,
      },
      {
        semesterRecordId: sem1.id,
        courseCode: "LAN201",
        courseTitle: "Chinese II",
        category: "FOREIGN_LANGUAGE",
        credits: 1.0,
        originalGrade: "A",
        originalPercentage: 96.0,
        unweightedGradePoint: 4.0,
        includeInGpa: true,
      },
      {
        semesterRecordId: sem1.id,
        courseCode: "BIB301",
        courseTitle: "Bible III",
        category: "OTHER",
        credits: 1.0,
        originalGrade: "A",
        originalPercentage: 97.0,
        unweightedGradePoint: 4.0,
        includeInGpa: true,
      },
    ],
  });

  // Standardized Tests for Student 1
  await prisma.standardizedTest.createMany({
    data: [
      {
        studentId: student1.id,
        testType: "TOEFL",
        totalScore: 112,
        testDate: new Date("2024-06-12"),
        sectionScoresJson: JSON.stringify({ reading: 29, listening: 29, speaking: 26, writing: 28 }),
        notes: "목표 110점 초과 달성",
        isRepresentative: true,
      },
      {
        studentId: student1.id,
        testType: "SAT",
        totalScore: 1520,
        testDate: new Date("2024-05-04"),
        sectionScoresJson: JSON.stringify({ ebrw: 740, math: 780 }),
        notes: "Math 800 재도전 검토 중",
        isRepresentative: true,
      },
      {
        studentId: student1.id,
        testType: "AP",
        totalScore: 5,
        testDate: new Date("2024-05-15"),
        sectionScoresJson: JSON.stringify({ subject: "AP Calculus BC", score: 5 }),
        notes: "Subscore AB: 5",
        isRepresentative: true,
      },
      {
        studentId: student1.id,
        testType: "AP",
        totalScore: 5,
        testDate: new Date("2024-05-18"),
        sectionScoresJson: JSON.stringify({ subject: "AP Physics C: Mech", score: 5 }),
        notes: "만점 취득",
        isRepresentative: true,
      },
      {
        studentId: student1.id,
        testType: "AP",
        totalScore: 4,
        testDate: new Date("2024-05-20"),
        sectionScoresJson: JSON.stringify({ subject: "AP Chemistry", score: 4 }),
        notes: "우수",
        isRepresentative: true,
      },
    ],
  });

  // Clubs & Awards for Student 1
  await prisma.clubActivity.createMany({
    data: [
      {
        studentId: student1.id,
        clubName: "MUN (Model UN)",
        role: "President",
        yearsActive: "10, 11, 12",
        description: "전국 고교 모의유엔 사무국장 및 교내 동아리 2년 연속 회장 역임",
      },
      {
        studentId: student1.id,
        clubName: "Varsity Soccer",
        role: "Captain",
        yearsActive: "9, 10, 11, 12",
        description: "학교 축구 대표팀 주장, KAIAC 대회 준우승 견인",
      },
      {
        studentId: student1.id,
        clubName: "STEM Peer Tutoring",
        role: "Mentor",
        yearsActive: "11, 12",
        description: "후배 학생들을 위한 AP Calculus 및 물리 주 2회 멘토링 봉사",
      },
    ],
  });

  await prisma.awardRecord.createMany({
    data: [
      {
        studentId: student1.id,
        awardTitle: "AMC 12 School Winner",
        awardType: "EXTERNAL",
        awardDate: new Date("2023-11-20"),
        issuer: "MAA (Mathematical Association of America)",
      },
      {
        studentId: student1.id,
        awardTitle: "LIS Academic Excellence Award",
        awardType: "INTERNAL",
        awardDate: new Date("2024-06-05"),
        issuer: "Lighthouse International School",
      },
    ],
  });

  // Counseling Log for Student 1
  await prisma.counselingLog.create({
    data: {
      studentId: student1.id,
      counselorId: counselorUser.id,
      counselDate: new Date("2024-10-15T14:30:00Z"),
      category: "목표대학 선정 / 원서전략",
      withParent: false,
      title: "12학년 1학기 Early 원서 타겟 최종 점검",
      content: "ED로 Cornell University 공과대학 지원 결심 확인. Math 780 유지 및 Common App Activity 섹션 보완 필요. 에세이에서 로보틱스 연구 프로젝트 경험을 집중적으로 부각하기로 지도함.",
      actionItems: JSON.stringify([
        { id: "1", task: "AP Calculus BC 1학기 성적 A 유지할 것", done: true },
        { id: "2", task: "Common App Activity 섹션 작성 후 10/22 피드백 요청", done: false },
        { id: "3", task: "물리 교사 추천서 최종 요청서 전달", done: true },
      ]),
      isConfidential: false,
    },
  });

  // Target Universities for Student 1
  await prisma.targetUniversity.createMany({
    data: [
      {
        studentId: student1.id,
        universityName: "Cornell University",
        location: "Ithaca, NY, USA",
        major: "Mechanical Engineering",
        proposerType: "TEACHER_RECOMMENDED",
        applicationType: "ED",
        admissionTier: "REACH",
        pros: "강력한 공대 동문 네트워크, 최고의 학부 연구 기회",
        cons: "높은 경쟁률, 매서운 겨울 날씨",
        counselorNotes: "학생의 로보틱스 EC와 전공 적합성 100% 일치. ED 카드로 최선의 승부수.",
        resultStatus: "APPLIED",
      },
      {
        studentId: student1.id,
        universityName: "Purdue University",
        location: "West Lafayette, IN, USA",
        major: "College of Engineering",
        proposerType: "TEACHER_RECOMMENDED",
        applicationType: "EA",
        admissionTier: "SAFETY",
        pros: "미국 최고의 가성비 및 공대 명성, 안정적 합격권",
        cons: "대규모 주립대 특성상 개별 케어 부족 가능성",
        counselorNotes: "안정 카드로 필수 지원 추천.",
        resultStatus: "CONSIDERING",
      },
      {
        studentId: student1.id,
        universityName: "MIT (Massachusetts Institute of Technology)",
        location: "Cambridge, MA, USA",
        major: "Mechanical & Aerospace Engineering",
        proposerType: "STUDENT_DESIRED",
        applicationType: "EA",
        admissionTier: "REACH",
        pros: "세계 최고의 연구소 및 산학 연계",
        cons: "합격률 4% 미만 초극상향",
        counselorNotes: "학생이 강력히 희망하여 EA로 지원하되 현실적 대안 필수.",
        resultStatus: "CONSIDERING",
      },
    ],
  });

  // 4. Create Sample Student 2: 1121 Seungjoo Back
  const student2 = await prisma.student.create({
    data: {
      studentCode: "1121",
      nameEn: "SEUNGJOO BACK",
      nameKo: "백승주",
      gradeLevel: 11,
      status: "ENROLLED",
      birthDate: new Date("2008-05-22"),
      gender: "M",
      entryDate: new Date("2022-08-18"),
      graduationDate: new Date("2026-06-10"),
      parentName: "백학부모",
      parentContact: "010-9876-5432",
      address: "서울시 강남구 대치동",
      cumulativeGpa: 3.956,
      coreCumulativeGpa: 3.970,
      cumulativeCredits: 14.0,
    },
  });

  // 5. Create Sample Student 3: 1018 Grace Lee (with Credit Make-up)
  const student3 = await prisma.student.create({
    data: {
      studentCode: "1018",
      nameEn: "Grace Lee",
      nameKo: "이은혜",
      gradeLevel: 12,
      status: "ENROLLED",
      birthDate: new Date("2007-09-10"),
      gender: "F",
      entryDate: new Date("2021-08-20"),
      graduationDate: new Date("2025-06-10"),
      parentName: "이학부모",
      parentContact: "010-5555-4444",
      cumulativeGpa: 3.750,
      coreCumulativeGpa: 3.810,
      cumulativeCredits: 21.0,
    },
  });

  const semGrace = await prisma.semesterRecord.create({
    data: {
      studentId: student3.id,
      academicYear: "2022-2023",
      termName: "Semester 2",
      gradeLevel: 10,
      termGpa: 3.65,
      termCoreGpa: 3.70,
      termCredits: 5.0,
    },
  });

  const courseGrace1 = await prisma.courseGrade.create({
    data: {
      semesterRecordId: semGrace.id,
      courseCode: "MAT201",
      courseTitle: "Algebra II",
      category: "MATH",
      credits: 1.0,
      originalGrade: "C+",
      originalPercentage: 78.0,
      unweightedGradePoint: 2.3,
      isCreditMakeup: true, // Credit Make-up applied!
      adjustedGrade: "B+",
      adjustedGradePoint: 3.3,
      makeupReason: "Summer School Credit Recovery Course completed (88%)",
      includeInGpa: true,
    },
  });

  await prisma.gradeAuditLog.create({
    data: {
      courseGradeId: courseGrace1.id,
      changedById: counselorUser.id,
      previousValue: JSON.stringify({ grade: "C+", point: 2.3 }),
      newValue: JSON.stringify({ grade: "B+", point: 3.3 }),
      reason: "여름 계절학기 Credit Recovery 이수 확인서 반영",
    },
  });

  console.log("✅ Sample Students (1017, 1121, 1018), Semesters, Grades & Credit Make-up created!");
  console.log("🚀 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
