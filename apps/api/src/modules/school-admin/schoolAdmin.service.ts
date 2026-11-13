import type {
  AcademicYearDto,
  AuditLogDto,
  ClassDto,
  SchoolAcademicSummaryDto,
  SchoolAlertDto,
  SchoolAttendanceSummaryDto,
  SchoolOverviewDto,
  SchoolRecentActivityDto,
  SchoolSettingsDto,
  SectionDto,
  StaffMemberDto,
  StudentDirectoryDto,
  SubjectDto,
  TeacherAllocationDto,
  TeacherDetailDto,
} from '@fsd-sdg4/contracts';
import type {
  AllocateTeacherInput,
  CreateAcademicYearInput,
  CreateClassInput,
  CreateSectionInput,
  CreateStaffInput,
  CreateStudentInput,
  CreateSubjectInput,
  StaffFilterQuery,
  UpdateSchoolSettingsInput,
  UpdateStaffInput,
} from '@fsd-sdg4/validation';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../shared/db/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors/appError.js';
import { hashPassword } from '../../shared/security/password.js';
import { recordAuditEvent } from '../audit/audit.service.js';

export async function getSchoolOverview(schoolId: string): Promise<SchoolOverviewDto> {
  const now = new Date();

  const [
    school,
    activeYear,
    totalStudents,
    totalStaff,
    totalClasses,
    totalSections,
    activeSupportPlans,
    latestAttendanceRecord,
    recentDatesWithAttendance,
    activeAssignments,
    upcomingAssessments,
    totalAssessments,
    recentAssessmentsRaw,
    recentStudentsRaw,
    recentAuditLogsRaw,
    pendingFlagsCount,
  ] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
    prisma.academicYear.findFirst({
      where: { schoolId, status: 'ACTIVE' },
      select: { name: true },
    }),
    prisma.studentProfile.count({ where: { schoolId, deletedAt: null } }),
    prisma.teacherProfile.count({ where: { schoolId } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.section.count({ where: { schoolId } }),
    prisma.supportPlan.count({ where: { schoolId, status: 'ACTIVE' } }),
    // Latest attendance date
    prisma.attendanceRecord.findFirst({
      where: { schoolId },
      orderBy: { attendanceDate: 'desc' },
      select: { attendanceDate: true },
    }),
    // Distinct recent attendance dates for weekly trend
    prisma.attendanceRecord.findMany({
      where: { schoolId },
      select: { attendanceDate: true },
      distinct: ['attendanceDate'],
      orderBy: { attendanceDate: 'desc' },
      take: 7,
    }),
    // Active published assignments
    prisma.assignment.count({ where: { schoolId, status: 'PUBLISHED' } }),
    // Upcoming assessments
    prisma.assessment.count({ where: { schoolId, assessmentDate: { gte: now } } }),
    // Total assessments
    prisma.assessment.count({ where: { schoolId } }),
    // Recent assessments with subject and class information
    prisma.assessment.findMany({
      where: { schoolId },
      orderBy: { assessmentDate: 'desc' },
      take: 5,
      include: {
        courseOffering: {
          include: {
            subject: { select: { name: true } },
            section: {
              include: {
                class: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    // Recent registered students
    prisma.studentProfile.findMany({
      where: { schoolId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentIdNumber: true,
        createdAt: true,
      },
    }),
    // Recent audit events for this school
    prisma.auditLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        actor: { select: { email: true } },
      },
    }),
    // Pending support flags
    prisma.supportFlag.count({ where: { schoolId, status: 'PROPOSED' } }),
  ]);

  if (!school) {
    throw new NotFoundError('School not found.');
  }

  // Attendance computation
  let attendance: SchoolAttendanceSummaryDto;
  if (latestAttendanceRecord) {
    const targetDate = latestAttendanceRecord.attendanceDate;
    const targetDateRecords = await prisma.attendanceRecord.findMany({
      where: { schoolId, attendanceDate: targetDate },
      select: { status: true },
    });

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const rec of targetDateRecords) {
      if (rec.status === 'PRESENT') present++;
      else if (rec.status === 'ABSENT') absent++;
      else if (rec.status === 'LATE') late++;
      else if (rec.status === 'EXCUSED') excused++;
    }

    const totalRecorded = targetDateRecords.length;
    const attendanceRate =
      totalRecorded > 0 ? Math.round(((present + late) / totalRecorded) * 100) : 0;

    // Daily trend from recent dates
    const trendDates = recentDatesWithAttendance.map((d) => d.attendanceDate).reverse();
    const trend = await Promise.all(
      trendDates.map(async (d) => {
        const dayRecords = await prisma.attendanceRecord.findMany({
          where: { schoolId, attendanceDate: d },
          select: { status: true },
        });
        const dayPresent = dayRecords.filter(
          (r) => r.status === 'PRESENT' || r.status === 'LATE',
        ).length;
        const dayAbsent = dayRecords.filter((r) => r.status === 'ABSENT').length;
        const dayTotal = dayRecords.length;
        const rate = dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0;
        return {
          date: d.toISOString().slice(0, 10),
          present: dayPresent,
          absent: dayAbsent,
          total: dayTotal,
          rate,
        };
      }),
    );

    attendance = {
      recordedDate: targetDate.toISOString().slice(0, 10),
      totalRecorded,
      present,
      absent,
      late,
      excused,
      attendanceRate,
      trend,
    };
  } else {
    attendance = {
      recordedDate: now.toISOString().slice(0, 10),
      totalRecorded: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendanceRate: 0,
      trend: [],
    };
  }

  // Academic summary
  const academic: SchoolAcademicSummaryDto = {
    activeAssignments,
    upcomingAssessments,
    totalAssessments,
    recentAssessments: recentAssessmentsRaw.map((a) => ({
      id: a.id,
      title: a.title,
      assessmentDate: a.assessmentDate.toISOString().slice(0, 10),
      subjectName: a.courseOffering.subject.name,
      className: `${a.courseOffering.section.class.name} (${a.courseOffering.section.name})`,
      maxMarks: Number(a.maxMarks),
      weightPercentage: Number(a.weightPercentage),
    })),
  };

  // Recent activity
  const activity: SchoolRecentActivityDto = {
    recentStudents: recentStudentsRaw.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      studentIdNumber: s.studentIdNumber,
      createdAt: s.createdAt.toISOString(),
    })),
    recentAuditLogs: recentAuditLogsRaw.map((log) => ({
      id: log.id,
      schoolId: log.schoolId,
      actorId: log.actorId,
      actorEmail: log.actor?.email ?? null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      delta: log.delta as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    })),
  };

  // Actionable alerts & notifications
  const alerts: SchoolAlertDto[] = [];
  if (!activeYear) {
    alerts.push({
      id: 'no-active-year',
      type: 'WARNING',
      title: 'No Active Academic Year',
      message:
        'An active academic year must be designated before scheduling courses and recording attendance.',
      actionUrl: '/admin/academic',
      actionLabel: 'Configure Academic Year',
    });
  }

  if (pendingFlagsCount > 0) {
    alerts.push({
      id: 'pending-support-flags',
      type: 'ACTION_REQUIRED',
      title: 'Student Support Flags Require Review',
      message: `${pendingFlagsCount} student support flag${pendingFlagsCount > 1 ? 's' : ''} proposed by teachers require administrative review.`,
      actionUrl: '/admin/settings',
      actionLabel: 'Review Audit & Logs',
    });
  }

  if (totalStaff === 0) {
    alerts.push({
      id: 'no-staff',
      type: 'INFO',
      title: 'No Teaching Staff Provisioned',
      message: 'Add faculty members to assign them to courses and classroom sections.',
      actionUrl: '/admin/staff',
      actionLabel: 'Manage Staff',
    });
  }

  if (totalStudents === 0) {
    alerts.push({
      id: 'no-students',
      type: 'INFO',
      title: 'No Students Enrolled',
      message: 'Register students into your school directory to begin classroom allocations.',
      actionUrl: '/admin/students',
      actionLabel: 'Register Students',
    });
  }

  return {
    schoolName: school.name,
    activeAcademicYear: activeYear?.name ?? null,
    totalStudents,
    totalStaff,
    totalClasses,
    totalSections,
    activeSupportPlans,
    attendance,
    academic,
    activity,
    alerts,
  };
}

export async function listAcademicYears(schoolId: string): Promise<AcademicYearDto[]> {
  const rows = await prisma.academicYear.findMany({
    where: { schoolId },
    orderBy: { startDate: 'desc' },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    startDate: row.startDate.toISOString().slice(0, 10),
    endDate: row.endDate.toISOString().slice(0, 10),
    status: row.status,
  }));
}

export async function createAcademicYear(
  schoolId: string,
  input: CreateAcademicYearInput,
  actorId: string,
  ipAddress: string | null,
): Promise<AcademicYearDto> {
  if (input.endDate <= input.startDate) {
    throw new BadRequestError('End date must be after start date.');
  }

  const existing = await prisma.academicYear.findFirst({
    where: { schoolId, name: input.name },
  });
  if (existing) {
    throw new ConflictError('An academic year with this name already exists.');
  }

  const hasActive = await prisma.academicYear.findFirst({
    where: { schoolId, status: 'ACTIVE' },
    select: { id: true },
  });

  const created = await prisma.academicYear.create({
    data: {
      schoolId,
      name: input.name,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      status: hasActive ? 'ARCHIVED' : 'ACTIVE',
    },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_ACADEMIC_YEAR_CREATED',
    entityType: 'AcademicYear',
    entityId: created.id,
    delta: { name: created.name },
    ipAddress,
  });

  return {
    id: created.id,
    name: created.name,
    startDate: created.startDate.toISOString().slice(0, 10),
    endDate: created.endDate.toISOString().slice(0, 10),
    status: created.status,
  };
}

export async function activateAcademicYear(
  schoolId: string,
  academicYearId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<AcademicYearDto> {
  const target = await prisma.academicYear.findFirst({
    where: { id: academicYearId, schoolId },
  });
  if (!target) {
    throw new NotFoundError('Academic year not found.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.academicYear.updateMany({
      where: { schoolId, status: 'ACTIVE', id: { not: academicYearId } },
      data: { status: 'ARCHIVED' },
    });

    return tx.academicYear.update({
      where: { id: academicYearId },
      data: { status: 'ACTIVE' },
    });
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_ACADEMIC_YEAR_ACTIVATED',
    entityType: 'AcademicYear',
    entityId: updated.id,
    ipAddress,
  });

  return {
    id: updated.id,
    name: updated.name,
    startDate: updated.startDate.toISOString().slice(0, 10),
    endDate: updated.endDate.toISOString().slice(0, 10),
    status: updated.status,
  };
}

export async function listClasses(schoolId: string): Promise<ClassDto[]> {
  const rows = await prisma.class.findMany({
    where: { schoolId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      sections: {
        orderBy: { name: 'asc' },
        include: {
          academicYear: { select: { name: true } },
        },
      },
    },
  });

  return rows.map((cls) => ({
    id: cls.id,
    name: cls.name,
    stage: cls.stage,
    sortOrder: cls.sortOrder,
    sections: cls.sections.map((sec) => ({
      id: sec.id,
      name: sec.name,
      capacity: sec.capacity,
      roomNumber: sec.roomNumber,
      academicYearId: sec.academicYearId,
      academicYearName: sec.academicYear.name,
    })),
  }));
}

export async function createClass(
  schoolId: string,
  input: CreateClassInput,
  actorId: string,
  ipAddress: string | null,
): Promise<ClassDto> {
  const existing = await prisma.class.findFirst({
    where: { schoolId, name: input.name },
  });
  if (existing) {
    throw new ConflictError('A class with this name already exists.');
  }

  const created = await prisma.class.create({
    data: {
      schoolId,
      name: input.name,
      stage: input.stage,
      sortOrder: input.sortOrder,
    },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_CLASS_CREATED',
    entityType: 'Class',
    entityId: created.id,
    delta: { name: created.name, stage: created.stage },
    ipAddress,
  });

  return {
    id: created.id,
    name: created.name,
    stage: created.stage,
    sortOrder: created.sortOrder,
    sections: [],
  };
}

export async function createSection(
  schoolId: string,
  input: CreateSectionInput,
  actorId: string,
  ipAddress: string | null,
): Promise<SectionDto> {
  const [cls, year] = await Promise.all([
    prisma.class.findFirst({ where: { id: input.classId, schoolId } }),
    prisma.academicYear.findFirst({ where: { id: input.academicYearId, schoolId } }),
  ]);

  if (!cls) {
    throw new NotFoundError('Class not found in this school.');
  }
  if (!year) {
    throw new NotFoundError('Academic year not found in this school.');
  }

  const existing = await prisma.section.findFirst({
    where: {
      schoolId,
      classId: input.classId,
      academicYearId: input.academicYearId,
      name: input.name,
    },
  });
  if (existing) {
    throw new ConflictError(
      'This section already exists for the selected class and academic year.',
    );
  }

  const created = await prisma.section.create({
    data: {
      schoolId,
      classId: input.classId,
      academicYearId: input.academicYearId,
      name: input.name,
      capacity: input.capacity ?? null,
      roomNumber: input.roomNumber ?? null,
    },
    include: {
      academicYear: { select: { name: true } },
    },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_SECTION_CREATED',
    entityType: 'Section',
    entityId: created.id,
    delta: { name: created.name, classId: input.classId },
    ipAddress,
  });

  return {
    id: created.id,
    name: created.name,
    capacity: created.capacity,
    roomNumber: created.roomNumber,
    academicYearId: created.academicYearId,
    academicYearName: created.academicYear.name,
  };
}

export async function listSubjects(schoolId: string): Promise<SubjectDto[]> {
  const rows = await prisma.subject.findMany({
    where: { schoolId },
    orderBy: { name: 'asc' },
  });

  return rows.map((sub) => ({
    id: sub.id,
    name: sub.name,
    code: sub.code,
    description: sub.description,
    credits: sub.credits ? sub.credits.toString() : null,
  }));
}

export async function createSubject(
  schoolId: string,
  input: CreateSubjectInput,
  actorId: string,
  ipAddress: string | null,
): Promise<SubjectDto> {
  const existing = await prisma.subject.findFirst({
    where: { schoolId, code: input.code },
  });
  if (existing) {
    throw new ConflictError('A subject with this code already exists.');
  }

  const created = await prisma.subject.create({
    data: {
      schoolId,
      name: input.name,
      code: input.code,
      description: input.description ?? null,
    },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_SUBJECT_CREATED',
    entityType: 'Subject',
    entityId: created.id,
    delta: { code: created.code, name: created.name },
    ipAddress,
  });

  return {
    id: created.id,
    name: created.name,
    code: created.code,
    description: created.description,
    credits: created.credits ? created.credits.toString() : null,
  };
}

export async function listStaff(
  schoolId: string,
  query?: StaffFilterQuery,
): Promise<StaffMemberDto[]> {
  const whereClause: Prisma.TeacherProfileWhereInput = {
    schoolId,
    user: { deletedAt: null },
  };

  if (query?.status && query.status !== 'ALL') {
    whereClause.user = { deletedAt: null, status: query.status };
  }

  if (query?.specialization) {
    whereClause.specialization = {
      contains: query.specialization,
      mode: 'insensitive',
    };
  }

  if (query?.search) {
    whereClause.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { employeeId: { contains: query.search, mode: 'insensitive' } },
      { user: { email: { contains: query.search, mode: 'insensitive' } } },
    ];
  }

  const rows = await prisma.teacherProfile.findMany({
    where: whereClause,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      user: { select: { email: true, status: true } },
      _count: { select: { courseAssignments: true } },
    },
  });

  return rows.map((staff) => ({
    id: staff.id,
    userId: staff.userId,
    employeeId: staff.employeeId,
    firstName: staff.firstName,
    lastName: staff.lastName,
    email: staff.user.email,
    specialization: staff.specialization,
    status: staff.user.status,
    allocationCount: staff._count.courseAssignments,
  }));
}

export async function getStaffById(schoolId: string, staffId: string): Promise<TeacherDetailDto> {
  const staff = await prisma.teacherProfile.findFirst({
    where: { id: staffId, schoolId },
    include: {
      user: true,
      courseAssignments: {
        include: {
          courseOffering: {
            include: {
              subject: true,
              section: {
                include: {
                  class: true,
                },
              },
              academicYear: true,
            },
          },
        },
      },
    },
  });

  if (!staff || staff.user.deletedAt !== null) {
    throw new NotFoundError('Teacher profile not found.');
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      schoolId,
      entityId: staff.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      actor: { select: { email: true } },
    },
  });

  const allocations: TeacherAllocationDto[] = staff.courseAssignments.map((ca) => ({
    id: ca.id,
    courseOfferingId: ca.courseOfferingId,
    subjectId: ca.courseOffering.subject.id,
    subjectName: ca.courseOffering.subject.name,
    subjectCode: ca.courseOffering.subject.code,
    sectionId: ca.courseOffering.section.id,
    sectionName: ca.courseOffering.section.name,
    classId: ca.courseOffering.section.class.id,
    className: ca.courseOffering.section.class.name,
    academicYearId: ca.courseOffering.academicYear.id,
    academicYearName: ca.courseOffering.academicYear.name,
    role: ca.role,
    assignedAt: ca.createdAt.toISOString(),
  }));

  const recentAuditLogs: AuditLogDto[] = auditLogs.map((log) => ({
    id: log.id,
    schoolId: log.schoolId,
    actorId: log.actorId,
    actorEmail: log.actor?.email ?? null,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    createdAt: log.createdAt.toISOString(),
  }));

  return {
    id: staff.id,
    userId: staff.userId,
    employeeId: staff.employeeId,
    firstName: staff.firstName,
    lastName: staff.lastName,
    email: staff.user.email,
    specialization: staff.specialization,
    status: staff.user.status,
    createdAt: staff.createdAt.toISOString(),
    updatedAt: staff.updatedAt.toISOString(),
    allocations,
    recentAuditLogs,
  };
}

export async function createStaff(
  schoolId: string,
  input: CreateStaffInput,
  actorId: string,
  ipAddress: string | null,
): Promise<StaffMemberDto> {
  const [existingEmail, existingEmp] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email } }),
    prisma.teacherProfile.findFirst({ where: { schoolId, employeeId: input.employeeId } }),
  ]);

  if (existingEmail) {
    throw new ConflictError('A user with this email already exists.');
  }
  if (existingEmp) {
    throw new ConflictError('A staff member with this employee ID already exists.');
  }

  const passwordHash = await hashPassword(input.temporaryPassword);

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        schoolId,
        email: input.email,
        passwordHash,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    });

    const profile = await tx.teacherProfile.create({
      data: {
        schoolId,
        userId: user.id,
        employeeId: input.employeeId,
        firstName: input.firstName,
        lastName: input.lastName,
        specialization: input.specialization ?? null,
      },
    });

    return { user, profile };
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_STAFF_CREATED',
    entityType: 'TeacherProfile',
    entityId: created.profile.id,
    delta: { employeeId: created.profile.employeeId },
    ipAddress,
  });

  return {
    id: created.profile.id,
    userId: created.user.id,
    employeeId: created.profile.employeeId,
    firstName: created.profile.firstName,
    lastName: created.profile.lastName,
    email: created.user.email,
    specialization: created.profile.specialization,
    status: created.user.status,
    allocationCount: 0,
  };
}

export async function updateStaff(
  schoolId: string,
  staffProfileId: string,
  input: UpdateStaffInput,
  actorId: string,
  ipAddress: string | null,
): Promise<StaffMemberDto> {
  const profile = await prisma.teacherProfile.findFirst({
    where: { id: staffProfileId, schoolId },
    include: { user: true },
  });

  if (!profile || profile.user.deletedAt !== null) {
    throw new NotFoundError('Staff member not found.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedProfile = await tx.teacherProfile.update({
      where: { id: staffProfileId },
      data: {
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
        ...(input.specialization !== undefined ? { specialization: input.specialization } : {}),
      },
    });

    let updatedUser = profile.user;
    if (input.status) {
      updatedUser = await tx.user.update({
        where: { id: profile.userId },
        data: { status: input.status },
      });
    }

    return { profile: updatedProfile, user: updatedUser };
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_STAFF_UPDATED',
    entityType: 'TeacherProfile',
    entityId: profile.id,
    delta: input as Record<string, unknown>,
    ipAddress,
  });

  return {
    id: updated.profile.id,
    userId: updated.user.id,
    employeeId: updated.profile.employeeId,
    firstName: updated.profile.firstName,
    lastName: updated.profile.lastName,
    email: updated.user.email,
    specialization: updated.profile.specialization,
    status: updated.user.status,
  };
}

export async function updateStaffStatus(
  schoolId: string,
  staffProfileId: string,
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED',
  actorId: string,
  ipAddress: string | null,
): Promise<StaffMemberDto> {
  return updateStaff(schoolId, staffProfileId, { status }, actorId, ipAddress);
}

export async function allocateTeacher(
  schoolId: string,
  teacherId: string,
  input: AllocateTeacherInput,
  actorId: string,
  ipAddress: string | null,
): Promise<TeacherAllocationDto> {
  const [teacher, year, subject, section] = await Promise.all([
    prisma.teacherProfile.findFirst({ where: { id: teacherId, schoolId } }),
    prisma.academicYear.findFirst({ where: { id: input.academicYearId, schoolId } }),
    prisma.subject.findFirst({ where: { id: input.subjectId, schoolId } }),
    prisma.section.findFirst({
      where: { id: input.sectionId, schoolId },
      include: { class: true },
    }),
  ]);

  if (!teacher) {
    throw new NotFoundError('Teacher profile not found.');
  }
  if (!year) {
    throw new NotFoundError('Academic year not found.');
  }
  if (!subject) {
    throw new NotFoundError('Subject not found.');
  }
  if (!section) {
    throw new NotFoundError('Section not found.');
  }

  // Find or create course offering for this year + section + subject
  const assignment = await prisma.$transaction(async (tx) => {
    let offering = await tx.courseOffering.findUnique({
      where: {
        schoolId_academicYearId_sectionId_subjectId: {
          schoolId,
          academicYearId: input.academicYearId,
          sectionId: input.sectionId,
          subjectId: input.subjectId,
        },
      },
    });

    if (!offering) {
      offering = await tx.courseOffering.create({
        data: {
          schoolId,
          academicYearId: input.academicYearId,
          sectionId: input.sectionId,
          subjectId: input.subjectId,
        },
      });
    }

    const existingAssignment = await tx.courseTeacher.findUnique({
      where: {
        schoolId_courseOfferingId_teacherId: {
          schoolId,
          courseOfferingId: offering.id,
          teacherId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictError('Teacher is already allocated to this course offering.');
    }

    return tx.courseTeacher.create({
      data: {
        schoolId,
        courseOfferingId: offering.id,
        teacherId,
        role: input.role,
      },
      include: {
        courseOffering: {
          include: {
            subject: true,
            section: { include: { class: true } },
            academicYear: true,
          },
        },
      },
    });
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_TEACHER_ALLOCATED',
    entityType: 'CourseTeacher',
    entityId: assignment.id,
    delta: {
      teacherId,
      subjectId: input.subjectId,
      sectionId: input.sectionId,
      role: input.role,
    },
    ipAddress,
  });

  return {
    id: assignment.id,
    courseOfferingId: assignment.courseOfferingId,
    subjectId: assignment.courseOffering.subject.id,
    subjectName: assignment.courseOffering.subject.name,
    subjectCode: assignment.courseOffering.subject.code,
    sectionId: assignment.courseOffering.section.id,
    sectionName: assignment.courseOffering.section.name,
    classId: assignment.courseOffering.section.class.id,
    className: assignment.courseOffering.section.class.name,
    academicYearId: assignment.courseOffering.academicYear.id,
    academicYearName: assignment.courseOffering.academicYear.name,
    role: assignment.role,
    assignedAt: assignment.createdAt.toISOString(),
  };
}

export async function deallocateTeacher(
  schoolId: string,
  teacherId: string,
  allocationId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<{ success: boolean }> {
  const assignment = await prisma.courseTeacher.findFirst({
    where: { id: allocationId, teacherId, schoolId },
  });

  if (!assignment) {
    throw new NotFoundError('Course allocation not found for this teacher.');
  }

  await prisma.courseTeacher.delete({
    where: { id: allocationId },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_TEACHER_DEALLOCATED',
    entityType: 'CourseTeacher',
    entityId: allocationId,
    delta: { teacherId },
    ipAddress,
  });

  return { success: true };
}

export async function deleteStaff(
  schoolId: string,
  staffProfileId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<{ success: boolean }> {
  const profile = await prisma.teacherProfile.findFirst({
    where: { id: staffProfileId, schoolId },
    include: { user: true },
  });

  if (!profile || profile.user.deletedAt !== null) {
    throw new NotFoundError('Staff member not found.');
  }

  // Soft-delete user account and set status to INACTIVE to preserve historic assessments/grades
  await prisma.user.update({
    where: { id: profile.userId },
    data: {
      deletedAt: new Date(),
      status: 'INACTIVE',
    },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_STAFF_DELETED',
    entityType: 'TeacherProfile',
    entityId: profile.id,
    delta: { status: 'INACTIVE', softDeleted: true },
    ipAddress,
  });

  return { success: true };
}

export async function listStudents(
  schoolId: string,
  search?: string,
): Promise<StudentDirectoryDto[]> {
  const rows = await prisma.studentProfile.findMany({
    where: {
      schoolId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { studentIdNumber: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      user: { select: { email: true } },
      enrollments: {
        where: { status: 'ACTIVE' },
        take: 1,
        include: {
          section: {
            include: { class: { select: { name: true } } },
          },
        },
      },
    },
  });

  return rows.map((student) => {
    const activeEnrollment = student.enrollments[0];
    const currentSection = activeEnrollment
      ? `${activeEnrollment.section.class.name} - ${activeEnrollment.section.name}`
      : null;

    return {
      id: student.id,
      userId: student.userId,
      studentIdNumber: student.studentIdNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.user.email,
      status: student.status,
      admissionDate: student.admissionDate.toISOString().slice(0, 10),
      currentSection,
    };
  });
}

export async function createStudent(
  schoolId: string,
  input: CreateStudentInput,
  actorId: string,
  ipAddress: string | null,
): Promise<StudentDirectoryDto> {
  const [existingEmail, existingStudent] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email } }),
    prisma.studentProfile.findFirst({
      where: { schoolId, studentIdNumber: input.studentIdNumber },
    }),
  ]);

  if (existingEmail) {
    throw new ConflictError('A user with this email already exists.');
  }
  if (existingStudent) {
    throw new ConflictError('A student with this ID number already exists.');
  }

  let sectionAcademicYearId: string | null = null;
  let sectionLabel: string | null = null;
  if (input.sectionId) {
    const section = await prisma.section.findFirst({
      where: { id: input.sectionId, schoolId },
      include: { class: { select: { name: true } } },
    });
    if (!section) {
      throw new NotFoundError('Selected section was not found in this school.');
    }
    sectionAcademicYearId = section.academicYearId;
    sectionLabel = `${section.class.name} - ${section.name}`;
  }

  const passwordHash = await hashPassword(input.temporaryPassword);

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        schoolId,
        email: input.email,
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    const profile = await tx.studentProfile.create({
      data: {
        schoolId,
        userId: user.id,
        studentIdNumber: input.studentIdNumber,
        firstName: input.firstName,
        lastName: input.lastName,
        admissionDate: new Date(input.admissionDate),
        status: 'ACTIVE',
      },
    });

    if (input.sectionId && sectionAcademicYearId) {
      await tx.enrollment.create({
        data: {
          schoolId,
          studentId: profile.id,
          sectionId: input.sectionId,
          academicYearId: sectionAcademicYearId,
          status: 'ACTIVE',
        },
      });
    }

    return { user, profile };
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_STUDENT_CREATED',
    entityType: 'StudentProfile',
    entityId: created.profile.id,
    delta: { studentIdNumber: created.profile.studentIdNumber },
    ipAddress,
  });

  return {
    id: created.profile.id,
    userId: created.user.id,
    studentIdNumber: created.profile.studentIdNumber,
    firstName: created.profile.firstName,
    lastName: created.profile.lastName,
    email: created.user.email,
    status: created.profile.status,
    admissionDate: created.profile.admissionDate.toISOString().slice(0, 10),
    currentSection: sectionLabel,
  };
}

export async function listSchoolAuditLogs(schoolId: string): Promise<AuditLogDto[]> {
  const logs = await prisma.auditLog.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      actor: { select: { email: true } },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    schoolId: log.schoolId,
    actorId: log.actorId,
    actorEmail: log.actor?.email ?? null,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    createdAt: log.createdAt.toISOString(),
  }));
}

export async function getSchoolSettings(schoolId: string): Promise<SchoolSettingsDto> {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    throw new NotFoundError('School not found.');
  }

  return {
    id: school.id,
    name: school.name,
    code: school.code,
    subdomain: school.subdomain,
    contactEmail: school.contactEmail,
    status: school.status,
  };
}

export async function updateSchoolSettings(
  schoolId: string,
  input: UpdateSchoolSettingsInput,
  actorId: string,
  ipAddress: string | null,
): Promise<SchoolSettingsDto> {
  const updated = await prisma.school.update({
    where: { id: schoolId },
    data: {
      name: input.name,
      contactEmail: input.contactEmail,
    },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_SETTINGS_UPDATED',
    entityType: 'School',
    entityId: schoolId,
    delta: input,
    ipAddress,
  });

  return {
    id: updated.id,
    name: updated.name,
    code: updated.code,
    subdomain: updated.subdomain,
    contactEmail: updated.contactEmail,
    status: updated.status,
  };
}
