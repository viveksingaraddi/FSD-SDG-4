/**
 * Deterministic, idempotent synthetic seed script for local development and testing.
 * ZERO REAL PII: All institutions, names, emails, and identifiers are fictional.
 * Never store or reuse production credentials in seed data.
 */

import { PrismaClient } from '@prisma/client';

/**
 * Deterministic Argon2id hash for local synthetic accounts with development password:
 * "SuperAdmin@2026!" (satisfies 12+ chars, uppercase, lowercase, digit, symbol).
 */
const SYNTHETIC_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$wq0lQ+cPmKQSmI5yu/Yuvg$7jlh3YGctwG75macj3VjzHGG3Tfa/BvWn3CP0LraalU';

// Deterministic UUIDs for idempotent seeding
const IDS = {
  superAdmin: '00000000-0000-4000-8000-000000000001',

  // Tenant 1: Greenfield Primary School
  schGreenfield: '10000000-0000-4000-8000-000000000001',
  gfAdmin: '10000000-0000-4000-8000-000000000010',
  gfTeacher1User: '10000000-0000-4000-8000-000000000011',
  gfTeacher2User: '10000000-0000-4000-8000-000000000012',
  gfStudent1User: '10000000-0000-4000-8000-000000000021',
  gfStudent2User: '10000000-0000-4000-8000-000000000022',
  gfParent1User: '10000000-0000-4000-8000-000000000031',
  gfTeacher1Profile: '10000000-0000-4000-8000-000000000111',
  gfTeacher2Profile: '10000000-0000-4000-8000-000000000112',
  gfStudent1Profile: '10000000-0000-4000-8000-000000000121',
  gfStudent2Profile: '10000000-0000-4000-8000-000000000122',
  gfYear: '10000000-0000-4000-8000-000000000201',
  gfClass7: '10000000-0000-4000-8000-000000000211',
  gfClass8: '10000000-0000-4000-8000-000000000212',
  gfSection7A: '10000000-0000-4000-8000-000000000221',
  gfSection8A: '10000000-0000-4000-8000-000000000222',
  gfSubjMath: '10000000-0000-4000-8000-000000000231',
  gfSubjSci: '10000000-0000-4000-8000-000000000232',
  gfCourseMath8A: '10000000-0000-4000-8000-000000000241',
  gfCourseSci8A: '10000000-0000-4000-8000-000000000242',
  gfResource1: '10000000-0000-4000-8000-000000000301',
  gfAssignment1: '10000000-0000-4000-8000-000000000311',
  gfSubmission1: '10000000-0000-4000-8000-000000000321',
  gfAssessment1: '10000000-0000-4000-8000-000000000331',
  gfResult1: '10000000-0000-4000-8000-000000000341',
  gfFeedback1: '10000000-0000-4000-8000-000000000351',
  gfSupportPlan1: '10000000-0000-4000-8000-000000000401',
  gfSupportFlag1: '10000000-0000-4000-8000-000000000411',
  gfSupportFlag2: '10000000-0000-4000-8000-000000000412',
  gfSupportAction1: '10000000-0000-4000-8000-000000000421',
  gfSupportReview1: '10000000-0000-4000-8000-000000000431',

  // Tenant 2: Highcrest Secondary School
  schHighcrest: '20000000-0000-4000-8000-000000000001',
  hcAdmin: '20000000-0000-4000-8000-000000000010',
  hcTeacher1User: '20000000-0000-4000-8000-000000000011',
  hcStudent1User: '20000000-0000-4000-8000-000000000021',
  hcTeacher1Profile: '20000000-0000-4000-8000-000000000111',
  hcStudent1Profile: '20000000-0000-4000-8000-000000000121',
  hcYear: '20000000-0000-4000-8000-000000000201',
  hcClass9: '20000000-0000-4000-8000-000000000211',
  hcSection9A: '20000000-0000-4000-8000-000000000221',
  hcSubjEng: '20000000-0000-4000-8000-000000000231',
  hcCourseEng9A: '20000000-0000-4000-8000-000000000241',

  // Tenant 3: Empty Horizon Academy
  schEmpty: '30000000-0000-4000-8000-000000000001',
  ehAdmin: '30000000-0000-4000-8000-000000000010',
} as const;

export async function seedDatabase(db: PrismaClient): Promise<void> {
  // 1. Platform Super Admin (schoolId = null)
  await db.user.upsert({
    where: { id: IDS.superAdmin },
    update: {},
    create: {
      id: IDS.superAdmin,
      schoolId: null,
      email: 'superadmin@example.invalid',
      passwordHash: SYNTHETIC_PASSWORD_HASH,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  // 2. Synthetic Schools
  await db.school.upsert({
    where: { id: IDS.schGreenfield },
    update: {},
    create: {
      id: IDS.schGreenfield,
      name: 'Greenfield Primary School',
      code: 'SCH-GREENFIELD',
      subdomain: 'greenfield',
      contactEmail: 'admin@greenfield.example.invalid',
      status: 'ACTIVE',
    },
  });

  await db.school.upsert({
    where: { id: IDS.schHighcrest },
    update: {},
    create: {
      id: IDS.schHighcrest,
      name: 'Highcrest Secondary School',
      code: 'SCH-HIGHCREST',
      subdomain: 'highcrest',
      contactEmail: 'admin@highcrest.example.invalid',
      status: 'ACTIVE',
    },
  });

  await db.school.upsert({
    where: { id: IDS.schEmpty },
    update: {},
    create: {
      id: IDS.schEmpty,
      name: 'Empty Horizon Academy',
      code: 'SCH-EMPTY',
      subdomain: 'empty-horizon',
      contactEmail: 'admin@emptyhorizon.example.invalid',
      status: 'ACTIVE',
    },
  });

  // 3. Greenfield Users & Profiles
  const gfUsers = [
    {
      id: IDS.gfAdmin,
      email: 'admin@greenfield.example.invalid',
      role: 'SCHOOL_ADMIN' as const,
    },
    {
      id: IDS.gfTeacher1User,
      email: 'teacher1@greenfield.example.invalid',
      role: 'TEACHER' as const,
    },
    {
      id: IDS.gfTeacher2User,
      email: 'teacher2@greenfield.example.invalid',
      role: 'TEACHER' as const,
    },
    {
      id: IDS.gfStudent1User,
      email: 'student1@greenfield.example.invalid',
      role: 'STUDENT' as const,
    },
    {
      id: IDS.gfStudent2User,
      email: 'student2@greenfield.example.invalid',
      role: 'STUDENT' as const,
    },
    {
      id: IDS.gfParent1User,
      email: 'parent1@greenfield.example.invalid',
      role: 'PARENT' as const,
    },
  ];

  for (const u of gfUsers) {
    await db.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        schoolId: IDS.schGreenfield,
        email: u.email,
        passwordHash: SYNTHETIC_PASSWORD_HASH,
        role: u.role,
        status: 'ACTIVE',
      },
    });
  }

  await db.teacherProfile.upsert({
    where: { id: IDS.gfTeacher1Profile },
    update: {},
    create: {
      id: IDS.gfTeacher1Profile,
      schoolId: IDS.schGreenfield,
      userId: IDS.gfTeacher1User,
      employeeId: 'GF-TCH-001',
      firstName: 'Ananya',
      lastName: 'Verma',
      specialization: 'Mathematics',
    },
  });

  await db.teacherProfile.upsert({
    where: { id: IDS.gfTeacher2Profile },
    update: {},
    create: {
      id: IDS.gfTeacher2Profile,
      schoolId: IDS.schGreenfield,
      userId: IDS.gfTeacher2User,
      employeeId: 'GF-TCH-002',
      firstName: 'Rohan',
      lastName: 'Kulkarni',
      specialization: 'General Science',
    },
  });

  await db.studentProfile.upsert({
    where: { id: IDS.gfStudent1Profile },
    update: {},
    create: {
      id: IDS.gfStudent1Profile,
      schoolId: IDS.schGreenfield,
      userId: IDS.gfStudent1User,
      studentIdNumber: 'GF-STU-2026-001',
      firstName: 'Aarav',
      lastName: 'Synthetic',
      dateOfBirth: new Date('2013-04-15'),
      status: 'ACTIVE',
      admissionDate: new Date('2026-06-01'),
    },
  });

  await db.studentProfile.upsert({
    where: { id: IDS.gfStudent2Profile },
    update: {},
    create: {
      id: IDS.gfStudent2Profile,
      schoolId: IDS.schGreenfield,
      userId: IDS.gfStudent2User,
      studentIdNumber: 'GF-STU-2026-002',
      firstName: 'Diya',
      lastName: 'Synthetic',
      dateOfBirth: new Date('2013-08-22'),
      status: 'ACTIVE',
      admissionDate: new Date('2026-06-01'),
    },
  });

  await db.guardianRelationship.upsert({
    where: {
      schoolId_guardianUserId_studentId: {
        schoolId: IDS.schGreenfield,
        guardianUserId: IDS.gfParent1User,
        studentId: IDS.gfStudent1Profile,
      },
    },
    update: {},
    create: {
      schoolId: IDS.schGreenfield,
      guardianUserId: IDS.gfParent1User,
      studentId: IDS.gfStudent1Profile,
      relationshipType: 'MOTHER',
      isPrimaryContact: true,
      isVerified: true,
      verifiedAt: new Date('2026-06-01T00:00:00Z'),
    },
  });

  // 4. Greenfield Academic Hierarchy
  await db.academicYear.upsert({
    where: { id: IDS.gfYear },
    update: {},
    create: {
      id: IDS.gfYear,
      schoolId: IDS.schGreenfield,
      name: '2026-2027',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-04-30'),
      status: 'ACTIVE',
    },
  });

  await db.class.upsert({
    where: { id: IDS.gfClass7 },
    update: {},
    create: {
      id: IDS.gfClass7,
      schoolId: IDS.schGreenfield,
      name: 'Grade 7',
      stage: 'Middle School',
      sortOrder: 7,
    },
  });

  await db.class.upsert({
    where: { id: IDS.gfClass8 },
    update: {},
    create: {
      id: IDS.gfClass8,
      schoolId: IDS.schGreenfield,
      name: 'Grade 8',
      stage: 'Middle School',
      sortOrder: 8,
    },
  });

  await db.section.upsert({
    where: { id: IDS.gfSection7A },
    update: {},
    create: {
      id: IDS.gfSection7A,
      schoolId: IDS.schGreenfield,
      classId: IDS.gfClass7,
      academicYearId: IDS.gfYear,
      name: '7-A',
      capacity: 35,
      roomNumber: 'Room 101',
    },
  });

  await db.section.upsert({
    where: { id: IDS.gfSection8A },
    update: {},
    create: {
      id: IDS.gfSection8A,
      schoolId: IDS.schGreenfield,
      classId: IDS.gfClass8,
      academicYearId: IDS.gfYear,
      name: '8-A',
      capacity: 35,
      roomNumber: 'Room 201',
    },
  });

  await db.subject.upsert({
    where: { id: IDS.gfSubjMath },
    update: {},
    create: {
      id: IDS.gfSubjMath,
      schoolId: IDS.schGreenfield,
      name: 'Mathematics',
      code: 'MATH-101',
      description: 'Foundational Algebra and Geometry',
      credits: 4.0,
    },
  });

  await db.subject.upsert({
    where: { id: IDS.gfSubjSci },
    update: {},
    create: {
      id: IDS.gfSubjSci,
      schoolId: IDS.schGreenfield,
      name: 'General Science',
      code: 'SCI-101',
      description: 'Integrated Physics, Chemistry, and Biology',
      credits: 4.0,
    },
  });

  await db.courseOffering.upsert({
    where: { id: IDS.gfCourseMath8A },
    update: {},
    create: {
      id: IDS.gfCourseMath8A,
      schoolId: IDS.schGreenfield,
      academicYearId: IDS.gfYear,
      sectionId: IDS.gfSection8A,
      subjectId: IDS.gfSubjMath,
      syllabus: 'Term 1: Linear Equations & Ratios',
    },
  });

  await db.courseOffering.upsert({
    where: { id: IDS.gfCourseSci8A },
    update: {},
    create: {
      id: IDS.gfCourseSci8A,
      schoolId: IDS.schGreenfield,
      academicYearId: IDS.gfYear,
      sectionId: IDS.gfSection8A,
      subjectId: IDS.gfSubjSci,
      syllabus: 'Term 1: Matter, Energy & Ecosystems',
    },
  });

  await db.courseTeacher.upsert({
    where: {
      schoolId_courseOfferingId_teacherId: {
        schoolId: IDS.schGreenfield,
        courseOfferingId: IDS.gfCourseMath8A,
        teacherId: IDS.gfTeacher1Profile,
      },
    },
    update: {},
    create: {
      schoolId: IDS.schGreenfield,
      courseOfferingId: IDS.gfCourseMath8A,
      teacherId: IDS.gfTeacher1Profile,
      role: 'PRIMARY',
    },
  });

  await db.courseTeacher.upsert({
    where: {
      schoolId_courseOfferingId_teacherId: {
        schoolId: IDS.schGreenfield,
        courseOfferingId: IDS.gfCourseSci8A,
        teacherId: IDS.gfTeacher2Profile,
      },
    },
    update: {},
    create: {
      schoolId: IDS.schGreenfield,
      courseOfferingId: IDS.gfCourseSci8A,
      teacherId: IDS.gfTeacher2Profile,
      role: 'PRIMARY',
    },
  });

  // 5. Enrollments & Attendance
  for (const studentId of [IDS.gfStudent1Profile, IDS.gfStudent2Profile]) {
    await db.enrollment.upsert({
      where: {
        schoolId_studentId_academicYearId: {
          schoolId: IDS.schGreenfield,
          studentId,
          academicYearId: IDS.gfYear,
        },
      },
      update: {},
      create: {
        schoolId: IDS.schGreenfield,
        studentId,
        sectionId: IDS.gfSection8A,
        academicYearId: IDS.gfYear,
        status: 'ACTIVE',
      },
    });
  }

  const attendanceDates = ['2026-10-12', '2026-10-13', '2026-10-14'];
  for (const [idx, dateStr] of attendanceDates.entries()) {
    await db.attendanceRecord.upsert({
      where: {
        schoolId_sectionId_studentId_attendanceDate: {
          schoolId: IDS.schGreenfield,
          sectionId: IDS.gfSection8A,
          studentId: IDS.gfStudent1Profile,
          attendanceDate: new Date(dateStr),
        },
      },
      update: {},
      create: {
        schoolId: IDS.schGreenfield,
        sectionId: IDS.gfSection8A,
        studentId: IDS.gfStudent1Profile,
        recordedById: IDS.gfTeacher1User,
        attendanceDate: new Date(dateStr),
        status: idx === 2 ? 'ABSENT' : 'PRESENT',
      },
    });

    await db.attendanceRecord.upsert({
      where: {
        schoolId_sectionId_studentId_attendanceDate: {
          schoolId: IDS.schGreenfield,
          sectionId: IDS.gfSection8A,
          studentId: IDS.gfStudent2Profile,
          attendanceDate: new Date(dateStr),
        },
      },
      update: {},
      create: {
        schoolId: IDS.schGreenfield,
        sectionId: IDS.gfSection8A,
        studentId: IDS.gfStudent2Profile,
        recordedById: IDS.gfTeacher1User,
        attendanceDate: new Date(dateStr),
        status: 'PRESENT',
      },
    });
  }

  // 6. Learning Resource, Assignment, Submission, Assessment, Feedback
  await db.learningResource.upsert({
    where: { id: IDS.gfResource1 },
    update: {},
    create: {
      id: IDS.gfResource1,
      schoolId: IDS.schGreenfield,
      courseOfferingId: IDS.gfCourseMath8A,
      createdById: IDS.gfTeacher1User,
      title: 'Linear Equations Study Guide',
      description: 'Step-by-step worked examples for Grade 8 algebra.',
      resourceType: 'TEXT_GUIDE',
      status: 'PUBLISHED',
    },
  });

  await db.assignment.upsert({
    where: { id: IDS.gfAssignment1 },
    update: {},
    create: {
      id: IDS.gfAssignment1,
      schoolId: IDS.schGreenfield,
      courseOfferingId: IDS.gfCourseMath8A,
      createdById: IDS.gfTeacher1User,
      title: 'Linear Equations Practice Set 1',
      instructions: 'Solve exercises 1 through 10 and show intermediate steps.',
      maxPoints: 20.0,
      dueDate: new Date('2026-10-20T23:59:00Z'),
      status: 'PUBLISHED',
    },
  });

  await db.assignmentSubmission.upsert({
    where: { id: IDS.gfSubmission1 },
    update: {},
    create: {
      id: IDS.gfSubmission1,
      schoolId: IDS.schGreenfield,
      assignmentId: IDS.gfAssignment1,
      studentId: IDS.gfStudent1Profile,
      gradedById: IDS.gfTeacher1User,
      status: 'GRADED',
      content: 'Synthetic student solution set 1.',
      score: 16.5,
      gradedAt: new Date('2026-10-21T10:00:00Z'),
    },
  });

  await db.feedback.upsert({
    where: { id: IDS.gfFeedback1 },
    update: {},
    create: {
      id: IDS.gfFeedback1,
      schoolId: IDS.schGreenfield,
      submissionId: IDS.gfSubmission1,
      authorId: IDS.gfTeacher1User,
      comment: 'Strong algebraic reasoning on questions 1–8; review sign changes on 9–10.',
    },
  });

  await db.assessment.upsert({
    where: { id: IDS.gfAssessment1 },
    update: {},
    create: {
      id: IDS.gfAssessment1,
      schoolId: IDS.schGreenfield,
      courseOfferingId: IDS.gfCourseMath8A,
      createdById: IDS.gfTeacher1User,
      title: 'Term 1 Midterm Exam',
      assessmentDate: new Date('2026-10-25'),
      weightPercentage: 30.0,
      maxMarks: 100.0,
    },
  });

  await db.assessmentResult.upsert({
    where: { id: IDS.gfResult1 },
    update: {},
    create: {
      id: IDS.gfResult1,
      schoolId: IDS.schGreenfield,
      assessmentId: IDS.gfAssessment1,
      studentId: IDS.gfStudent1Profile,
      recordedById: IDS.gfTeacher1User,
      score: 78.0,
      gradeLetter: 'B',
      notes: 'Consistent performance.',
    },
  });

  // 7. Progress Snapshot & Closed-Loop Support Records
  await db.progressSnapshot.upsert({
    where: {
      schoolId_studentId_academicYearId_periodStart_periodEnd: {
        schoolId: IDS.schGreenfield,
        studentId: IDS.gfStudent1Profile,
        academicYearId: IDS.gfYear,
        periodStart: new Date('2026-09-15'),
        periodEnd: new Date('2026-10-15'),
      },
    },
    update: {},
    create: {
      schoolId: IDS.schGreenfield,
      studentId: IDS.gfStudent1Profile,
      academicYearId: IDS.gfYear,
      periodStart: new Date('2026-09-15'),
      periodEnd: new Date('2026-10-15'),
      attendanceRate: 66.67,
      assignmentCompletionRate: 100.0,
      weightedAverageScore: 78.0,
    },
  });

  await db.supportPlan.upsert({
    where: { id: IDS.gfSupportPlan1 },
    update: {},
    create: {
      id: IDS.gfSupportPlan1,
      schoolId: IDS.schGreenfield,
      studentId: IDS.gfStudent1Profile,
      leadTeacherId: IDS.gfTeacher1User,
      problemSummary: 'Rolling attendance dipped below 75% in October.',
      targetGoal: 'Achieve >= 90% attendance over the next 21 calendar days.',
      reviewDate: new Date('2026-11-15'),
      status: 'ACTIVE',
    },
  });

  await db.supportFlag.upsert({
    where: { id: IDS.gfSupportFlag1 },
    update: {},
    create: {
      id: IDS.gfSupportFlag1,
      schoolId: IDS.schGreenfield,
      studentId: IDS.gfStudent1Profile,
      reviewedById: IDS.gfTeacher1User,
      supportPlanId: IDS.gfSupportPlan1,
      flagType: 'ATTENDANCE_RISK',
      severity: 'MEDIUM',
      rationale: 'Attendance rate 66.67% over evaluation window (1 unexcused absence).',
      status: 'IN_PLAN',
      reviewedAt: new Date('2026-10-16T09:00:00Z'),
    },
  });

  await db.supportFlag.upsert({
    where: { id: IDS.gfSupportFlag2 },
    update: {},
    create: {
      id: IDS.gfSupportFlag2,
      schoolId: IDS.schGreenfield,
      studentId: IDS.gfStudent2Profile,
      flagType: 'ACADEMIC_ENGAGEMENT_RISK',
      severity: 'LOW',
      rationale: 'Synthetic proposed flag awaiting teacher human review.',
      status: 'PROPOSED',
    },
  });

  await db.supportPlanAction.upsert({
    where: { id: IDS.gfSupportAction1 },
    update: {},
    create: {
      id: IDS.gfSupportAction1,
      schoolId: IDS.schGreenfield,
      supportPlanId: IDS.gfSupportPlan1,
      assigneeId: IDS.gfTeacher1User,
      description: 'Weekly check-in with guardian and homeroom morning greeting.',
      dueDate: new Date('2026-10-30'),
      status: 'IN_PROGRESS',
    },
  });

  await db.supportReview.upsert({
    where: { id: IDS.gfSupportReview1 },
    update: {},
    create: {
      id: IDS.gfSupportReview1,
      schoolId: IDS.schGreenfield,
      supportPlanId: IDS.gfSupportPlan1,
      reviewerId: IDS.gfTeacher1User,
      reviewDate: new Date('2026-10-28'),
      outcomeStatus: 'CONTINUED',
      notes: 'Attendance improved in week 2; continuing check-ins until target date.',
    },
  });

  // 8. Tenant 2: Highcrest Secondary School (for cross-tenant isolation testing)
  for (const u of [
    { id: IDS.hcAdmin, email: 'admin@highcrest.example.invalid', role: 'SCHOOL_ADMIN' as const },
    {
      id: IDS.hcTeacher1User,
      email: 'teacher1@highcrest.example.invalid',
      role: 'TEACHER' as const,
    },
    {
      id: IDS.hcStudent1User,
      email: 'student1@highcrest.example.invalid',
      role: 'STUDENT' as const,
    },
  ]) {
    await db.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        schoolId: IDS.schHighcrest,
        email: u.email,
        passwordHash: SYNTHETIC_PASSWORD_HASH,
        role: u.role,
        status: 'ACTIVE',
      },
    });
  }

  await db.teacherProfile.upsert({
    where: { id: IDS.hcTeacher1Profile },
    update: {},
    create: {
      id: IDS.hcTeacher1Profile,
      schoolId: IDS.schHighcrest,
      userId: IDS.hcTeacher1User,
      employeeId: 'HC-TCH-001',
      firstName: 'Meera',
      lastName: 'Nair',
      specialization: 'English Literature',
    },
  });

  await db.studentProfile.upsert({
    where: { id: IDS.hcStudent1Profile },
    update: {},
    create: {
      id: IDS.hcStudent1Profile,
      schoolId: IDS.schHighcrest,
      userId: IDS.hcStudent1User,
      studentIdNumber: 'HC-STU-2026-001',
      firstName: 'Kabir',
      lastName: 'Synthetic',
      status: 'ACTIVE',
      admissionDate: new Date('2026-06-01'),
    },
  });

  await db.academicYear.upsert({
    where: { id: IDS.hcYear },
    update: {},
    create: {
      id: IDS.hcYear,
      schoolId: IDS.schHighcrest,
      name: '2026-2027',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-04-30'),
      status: 'ACTIVE',
    },
  });

  await db.class.upsert({
    where: { id: IDS.hcClass9 },
    update: {},
    create: {
      id: IDS.hcClass9,
      schoolId: IDS.schHighcrest,
      name: 'Grade 9',
      stage: 'Secondary',
      sortOrder: 9,
    },
  });

  await db.section.upsert({
    where: { id: IDS.hcSection9A },
    update: {},
    create: {
      id: IDS.hcSection9A,
      schoolId: IDS.schHighcrest,
      classId: IDS.hcClass9,
      academicYearId: IDS.hcYear,
      name: '9-A',
      capacity: 30,
    },
  });

  await db.subject.upsert({
    where: { id: IDS.hcSubjEng },
    update: {},
    create: {
      id: IDS.hcSubjEng,
      schoolId: IDS.schHighcrest,
      name: 'English Literature',
      code: 'ENG-101',
    },
  });

  await db.courseOffering.upsert({
    where: { id: IDS.hcCourseEng9A },
    update: {},
    create: {
      id: IDS.hcCourseEng9A,
      schoolId: IDS.schHighcrest,
      academicYearId: IDS.hcYear,
      sectionId: IDS.hcSection9A,
      subjectId: IDS.hcSubjEng,
    },
  });

  await db.enrollment.upsert({
    where: {
      schoolId_studentId_academicYearId: {
        schoolId: IDS.schHighcrest,
        studentId: IDS.hcStudent1Profile,
        academicYearId: IDS.hcYear,
      },
    },
    update: {},
    create: {
      schoolId: IDS.schHighcrest,
      studentId: IDS.hcStudent1Profile,
      sectionId: IDS.hcSection9A,
      academicYearId: IDS.hcYear,
      status: 'ACTIVE',
    },
  });

  // 9. Tenant 3: Empty Horizon Academy (admin only)
  await db.user.upsert({
    where: { id: IDS.ehAdmin },
    update: {},
    create: {
      id: IDS.ehAdmin,
      schoolId: IDS.schEmpty,
      email: 'admin@emptyhorizon.example.invalid',
      passwordHash: SYNTHETIC_PASSWORD_HASH,
      role: 'SCHOOL_ADMIN',
      status: 'ACTIVE',
    },
  });
}

async function main(): Promise<void> {
  const client = new PrismaClient();
  try {
    await seedDatabase(client);
    process.stdout.write('✅ Synthetic multi-tenant seed completed successfully.\n');
  } finally {
    await client.$disconnect();
  }
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.endsWith('seed.ts');

if (isDirectExecution) {
  main().catch((err: unknown) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
