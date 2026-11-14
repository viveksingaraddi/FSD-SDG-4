import crypto from 'node:crypto';
import type {
  AcademicYearDto,
  AuditLogDto,
  ClassDto,
  CompleteOnboardingResultDto,
  CourseOfferingDto,
  OfferingTeacherDto,
  OnboardingStepKey,
  SaveOnboardingProgressResultDto,
  SchoolAcademicSummaryDto,
  SchoolAlertDto,
  SchoolAttendanceSummaryDto,
  SchoolOnboardingStatusDto,
  SchoolOverviewDto,
  SchoolRecentActivityDto,
  SchoolSettingsDto,
  SectionDto,
  StaffMemberDto,
  StudentDirectoryDto,
  SubjectDto,
  TeacherAllocationDto,
  TeacherDetailDto,
  UserInvitationDto,
} from '@fsd-sdg4/contracts';
import type {
  AllocateTeacherInput,
  AssignOfferingTeacherInput,
  CreateAcademicYearInput,
  CreateClassInput,
  CreateOfferingInput,
  CreateSectionInput,
  CreateStaffInput,
  CreateStudentInput,
  CreateSubjectInput,
  InvitationFilterQuery,
  InviteUserInput,
  OfferingFilterQuery,
  SaveOnboardingProgressInput,
  StaffFilterQuery,
  UpdateAcademicYearInput,
  UpdateClassInput,
  UpdateSchoolSettingsInput,
  UpdateSectionInput,
  UpdateStaffInput,
  UpdateSubjectInput,
} from '@fsd-sdg4/validation';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/db/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors/appError.js';
import { hashPassword } from '../../shared/security/password.js';
import { AUDIT_ACTIONS, recordAuditEvent } from '../audit/audit.service.js';
import {
  createInvitation,
  listInvitations,
  resendInvitation,
  revokeInvitation,
} from '../invitations/invitation.service.js';
import { dispatchInvitationEmail } from '../mail/mail.service.js';

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
    include: {
      _count: {
        select: { sections: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    startDate: row.startDate.toISOString().slice(0, 10),
    endDate: row.endDate.toISOString().slice(0, 10),
    status: row.status,
    sectionCount: row._count.sections,
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
    include: {
      _count: { select: { sections: true } },
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
    sectionCount: created._count.sections,
  };
}

export async function updateAcademicYear(
  schoolId: string,
  academicYearId: string,
  input: UpdateAcademicYearInput,
  actorId: string,
  ipAddress: string | null,
): Promise<AcademicYearDto> {
  const existing = await prisma.academicYear.findFirst({
    where: { id: academicYearId, schoolId },
  });
  if (!existing) {
    throw new NotFoundError('Academic year not found.');
  }

  const startDate = input.startDate ? new Date(input.startDate) : existing.startDate;
  const endDate = input.endDate ? new Date(input.endDate) : existing.endDate;

  if (endDate <= startDate) {
    throw new BadRequestError('End date must be after start date.');
  }

  if (input.name && input.name !== existing.name) {
    const duplicate = await prisma.academicYear.findFirst({
      where: { schoolId, name: input.name, id: { not: academicYearId } },
    });
    if (duplicate) {
      throw new ConflictError('An academic year with this name already exists.');
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (input.status === 'ACTIVE') {
      await tx.academicYear.updateMany({
        where: { schoolId, status: 'ACTIVE', id: { not: academicYearId } },
        data: { status: 'ARCHIVED' },
      });
    }

    await tx.academicYear.update({
      where: { id: academicYearId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
        ...(input.endDate ? { endDate: new Date(input.endDate) } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
    });

    return tx.academicYear.findUniqueOrThrow({
      where: { id: academicYearId },
      include: {
        _count: { select: { sections: true } },
      },
    });
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_ACADEMIC_YEAR_UPDATED',
    entityType: 'AcademicYear',
    entityId: updated.id,
    delta: input,
    ipAddress,
  });

  return {
    id: updated.id,
    name: updated.name,
    startDate: updated.startDate.toISOString().slice(0, 10),
    endDate: updated.endDate.toISOString().slice(0, 10),
    status: updated.status,
    sectionCount: updated._count.sections,
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

    await tx.academicYear.update({
      where: { id: academicYearId },
      data: { status: 'ACTIVE' },
    });

    return tx.academicYear.findUniqueOrThrow({
      where: { id: academicYearId },
      include: {
        _count: { select: { sections: true } },
      },
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
    sectionCount: updated._count.sections,
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
          _count: { select: { enrollments: true } },
        },
      },
    },
  });

  return rows.map((cls) => {
    let totalClassStudents = 0;
    const sections = cls.sections.map((sec) => {
      const studentCount = sec._count.enrollments;
      totalClassStudents += studentCount;
      return {
        id: sec.id,
        name: sec.name,
        capacity: sec.capacity,
        roomNumber: sec.roomNumber,
        academicYearId: sec.academicYearId,
        academicYearName: sec.academicYear.name,
        classId: cls.id,
        className: cls.name,
        studentCount,
      };
    });

    return {
      id: cls.id,
      name: cls.name,
      stage: cls.stage,
      sortOrder: cls.sortOrder,
      sections,
      studentCount: totalClassStudents,
    };
  });
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
    studentCount: 0,
  };
}

export async function updateClass(
  schoolId: string,
  classId: string,
  input: UpdateClassInput,
  actorId: string,
  ipAddress: string | null,
): Promise<ClassDto> {
  const existing = await prisma.class.findFirst({
    where: { id: classId, schoolId },
    include: {
      sections: {
        include: {
          academicYear: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
      },
    },
  });
  if (!existing) {
    throw new NotFoundError('Class not found.');
  }

  if (input.name && input.name !== existing.name) {
    const duplicate = await prisma.class.findFirst({
      where: { schoolId, name: input.name, id: { not: classId } },
    });
    if (duplicate) {
      throw new ConflictError('A class with this name already exists.');
    }
  }

  const updated = await prisma.class.update({
    where: { id: classId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.stage ? { stage: input.stage } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
    include: {
      sections: {
        include: {
          academicYear: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
      },
    },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_CLASS_UPDATED',
    entityType: 'Class',
    entityId: updated.id,
    delta: input,
    ipAddress,
  });

  let totalStudents = 0;
  const sections = updated.sections.map((sec) => {
    totalStudents += sec._count.enrollments;
    return {
      id: sec.id,
      name: sec.name,
      capacity: sec.capacity,
      roomNumber: sec.roomNumber,
      academicYearId: sec.academicYearId,
      academicYearName: sec.academicYear.name,
      classId: updated.id,
      className: updated.name,
      studentCount: sec._count.enrollments,
    };
  });

  return {
    id: updated.id,
    name: updated.name,
    stage: updated.stage,
    sortOrder: updated.sortOrder,
    sections,
    studentCount: totalStudents,
  };
}

export async function deleteClass(
  schoolId: string,
  classId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<{ success: true }> {
  const existing = await prisma.class.findFirst({
    where: { id: classId, schoolId },
    include: { _count: { select: { sections: true } } },
  });
  if (!existing) {
    throw new NotFoundError('Class not found.');
  }
  if (existing._count.sections > 0) {
    throw new ConflictError('Cannot delete a class that contains active sections.');
  }

  await prisma.class.delete({ where: { id: classId } });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_CLASS_DELETED',
    entityType: 'Class',
    entityId: classId,
    delta: { name: existing.name },
    ipAddress,
  });

  return { success: true };
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
      class: { select: { name: true } },
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
    classId: created.classId,
    className: created.class.name,
    studentCount: 0,
  };
}

export async function updateSection(
  schoolId: string,
  sectionId: string,
  input: UpdateSectionInput,
  actorId: string,
  ipAddress: string | null,
): Promise<SectionDto> {
  const existing = await prisma.section.findFirst({
    where: { id: sectionId, schoolId },
    include: {
      academicYear: { select: { name: true } },
      class: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
  });
  if (!existing) {
    throw new NotFoundError('Section not found.');
  }

  if (input.name && input.name !== existing.name) {
    const duplicate = await prisma.section.findFirst({
      where: {
        schoolId,
        academicYearId: existing.academicYearId,
        classId: existing.classId,
        name: input.name,
        id: { not: sectionId },
      },
    });
    if (duplicate) {
      throw new ConflictError(
        'A section with this name already exists in this class and academic year.',
      );
    }
  }

  const updated = await prisma.section.update({
    where: { id: sectionId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
      ...(input.roomNumber !== undefined ? { roomNumber: input.roomNumber } : {}),
    },
    include: {
      academicYear: { select: { name: true } },
      class: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_SECTION_UPDATED',
    entityType: 'Section',
    entityId: updated.id,
    delta: input,
    ipAddress,
  });

  return {
    id: updated.id,
    name: updated.name,
    capacity: updated.capacity,
    roomNumber: updated.roomNumber,
    academicYearId: updated.academicYearId,
    academicYearName: updated.academicYear.name,
    classId: updated.classId,
    className: updated.class.name,
    studentCount: updated._count.enrollments,
  };
}

export async function deleteSection(
  schoolId: string,
  sectionId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<{ success: true }> {
  const existing = await prisma.section.findFirst({
    where: { id: sectionId, schoolId },
    include: {
      _count: {
        select: {
          enrollments: true,
          courseOfferings: true,
          attendanceRecords: true,
        },
      },
    },
  });
  if (!existing) {
    throw new NotFoundError('Section not found.');
  }
  if (
    existing._count.enrollments > 0 ||
    existing._count.courseOfferings > 0 ||
    existing._count.attendanceRecords > 0
  ) {
    throw new ConflictError(
      'Cannot delete a section with associated enrollments, course offerings, or attendance records.',
    );
  }

  await prisma.section.delete({ where: { id: sectionId } });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_SECTION_DELETED',
    entityType: 'Section',
    entityId: sectionId,
    delta: { name: existing.name },
    ipAddress,
  });

  return { success: true };
}

export async function listSubjects(schoolId: string): Promise<SubjectDto[]> {
  const rows = await prisma.subject.findMany({
    where: { schoolId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { courseOfferings: true },
      },
    },
  });

  return rows.map((sub) => ({
    id: sub.id,
    name: sub.name,
    code: sub.code,
    description: sub.description,
    credits: sub.credits ? sub.credits.toString() : null,
    offeringCount: sub._count.courseOfferings,
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
    include: {
      _count: { select: { courseOfferings: true } },
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
    offeringCount: created._count.courseOfferings,
  };
}

export async function updateSubject(
  schoolId: string,
  subjectId: string,
  input: UpdateSubjectInput,
  actorId: string,
  ipAddress: string | null,
): Promise<SubjectDto> {
  const existing = await prisma.subject.findFirst({
    where: { id: subjectId, schoolId },
  });
  if (!existing) {
    throw new NotFoundError('Subject not found.');
  }

  if (input.code && input.code !== existing.code) {
    const duplicate = await prisma.subject.findFirst({
      where: { schoolId, code: input.code, id: { not: subjectId } },
    });
    if (duplicate) {
      throw new ConflictError('A subject with this code already exists.');
    }
  }

  const updated = await prisma.subject.update({
    where: { id: subjectId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.code ? { code: input.code } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.credits !== undefined
        ? { credits: input.credits !== null ? new Prisma.Decimal(input.credits) : null }
        : {}),
    },
    include: {
      _count: { select: { courseOfferings: true } },
    },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_SUBJECT_UPDATED',
    entityType: 'Subject',
    entityId: updated.id,
    delta: input,
    ipAddress,
  });

  return {
    id: updated.id,
    name: updated.name,
    code: updated.code,
    description: updated.description,
    credits: updated.credits ? updated.credits.toString() : null,
    offeringCount: updated._count.courseOfferings,
  };
}

export async function deleteSubject(
  schoolId: string,
  subjectId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<{ success: true }> {
  const existing = await prisma.subject.findFirst({
    where: { id: subjectId, schoolId },
    include: { _count: { select: { courseOfferings: true } } },
  });
  if (!existing) {
    throw new NotFoundError('Subject not found.');
  }
  if (existing._count.courseOfferings > 0) {
    throw new ConflictError('Cannot delete a subject currently assigned to course offerings.');
  }

  await prisma.subject.delete({ where: { id: subjectId } });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_SUBJECT_DELETED',
    entityType: 'Subject',
    entityId: subjectId,
    delta: { code: existing.code },
    ipAddress,
  });

  return { success: true };
}

export async function listCourseOfferings(
  schoolId: string,
  filter?: OfferingFilterQuery,
): Promise<CourseOfferingDto[]> {
  const where: Prisma.CourseOfferingWhereInput = {
    schoolId,
    ...(filter?.academicYearId ? { academicYearId: filter.academicYearId } : {}),
    ...(filter?.sectionId ? { sectionId: filter.sectionId } : {}),
    ...(filter?.subjectId ? { subjectId: filter.subjectId } : {}),
    ...(filter?.classId ? { section: { classId: filter.classId } } : {}),
  };

  const rows = await prisma.courseOffering.findMany({
    where,
    orderBy: [
      { academicYear: { startDate: 'desc' } },
      { section: { name: 'asc' } },
      { subject: { name: 'asc' } },
    ],
    include: {
      academicYear: { select: { name: true } },
      section: {
        include: {
          class: { select: { id: true, name: true } },
        },
      },
      subject: true,
      courseTeachers: {
        include: {
          teacher: true,
        },
      },
    },
  });

  return rows.map((offering) => ({
    id: offering.id,
    academicYearId: offering.academicYearId,
    academicYearName: offering.academicYear.name,
    classId: offering.section.class.id,
    className: offering.section.class.name,
    sectionId: offering.sectionId,
    sectionName: offering.section.name,
    subjectId: offering.subjectId,
    subjectName: offering.subject.name,
    subjectCode: offering.subject.code,
    syllabus: offering.syllabus,
    teachers: offering.courseTeachers.map((ct) => ({
      allocationId: ct.id,
      teacherId: ct.teacherId,
      teacherName: `${ct.teacher.firstName} ${ct.teacher.lastName}`,
      employeeId: ct.teacher.employeeId,
      role: ct.role,
    })),
  }));
}

export async function createCourseOffering(
  schoolId: string,
  input: CreateOfferingInput,
  actorId: string,
  ipAddress: string | null,
): Promise<CourseOfferingDto> {
  const [year, section, subject] = await Promise.all([
    prisma.academicYear.findFirst({ where: { id: input.academicYearId, schoolId } }),
    prisma.section.findFirst({
      where: { id: input.sectionId, schoolId },
      include: { class: true },
    }),
    prisma.subject.findFirst({ where: { id: input.subjectId, schoolId } }),
  ]);

  if (!year) throw new NotFoundError('Academic year not found in this school.');
  if (!section) throw new NotFoundError('Section not found in this school.');
  if (!subject) throw new NotFoundError('Subject not found in this school.');

  if (section.academicYearId !== input.academicYearId) {
    throw new BadRequestError('Section does not belong to the specified academic year.');
  }

  const existing = await prisma.courseOffering.findUnique({
    where: {
      schoolId_academicYearId_sectionId_subjectId: {
        schoolId,
        academicYearId: input.academicYearId,
        sectionId: input.sectionId,
        subjectId: input.subjectId,
      },
    },
  });
  if (existing) {
    throw new ConflictError('A course offering for this subject and section already exists.');
  }

  if (input.teacherId) {
    const teacher = await prisma.teacherProfile.findFirst({
      where: { id: input.teacherId, schoolId },
    });
    if (!teacher) throw new NotFoundError('Teacher not found in this school.');
  }

  const created = await prisma.$transaction(async (tx) => {
    const offering = await tx.courseOffering.create({
      data: {
        schoolId,
        academicYearId: input.academicYearId,
        sectionId: input.sectionId,
        subjectId: input.subjectId,
        syllabus: input.syllabus ?? null,
      },
    });

    if (input.teacherId) {
      await tx.courseTeacher.create({
        data: {
          schoolId,
          courseOfferingId: offering.id,
          teacherId: input.teacherId,
          role: input.role,
        },
      });
    }

    return tx.courseOffering.findUniqueOrThrow({
      where: { id: offering.id },
      include: {
        academicYear: { select: { name: true } },
        section: {
          include: { class: { select: { id: true, name: true } } },
        },
        subject: true,
        courseTeachers: {
          include: { teacher: true },
        },
      },
    });
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_OFFERING_CREATED',
    entityType: 'CourseOffering',
    entityId: created.id,
    delta: {
      sectionId: input.sectionId,
      subjectId: input.subjectId,
      teacherId: input.teacherId,
    },
    ipAddress,
  });

  return {
    id: created.id,
    academicYearId: created.academicYearId,
    academicYearName: created.academicYear.name,
    classId: created.section.class.id,
    className: created.section.class.name,
    sectionId: created.sectionId,
    sectionName: created.section.name,
    subjectId: created.subjectId,
    subjectName: created.subject.name,
    subjectCode: created.subject.code,
    syllabus: created.syllabus,
    teachers: created.courseTeachers.map((ct) => ({
      allocationId: ct.id,
      teacherId: ct.teacherId,
      teacherName: `${ct.teacher.firstName} ${ct.teacher.lastName}`,
      employeeId: ct.teacher.employeeId,
      role: ct.role,
    })),
  };
}

export async function deleteCourseOffering(
  schoolId: string,
  offeringId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<{ success: true }> {
  const existing = await prisma.courseOffering.findFirst({
    where: { id: offeringId, schoolId },
    include: {
      _count: {
        select: {
          assignments: true,
          assessments: true,
          learningResources: true,
        },
      },
    },
  });
  if (!existing) {
    throw new NotFoundError('Course offering not found.');
  }

  if (
    existing._count.assignments > 0 ||
    existing._count.assessments > 0 ||
    existing._count.learningResources > 0
  ) {
    throw new ConflictError(
      'Cannot delete course offering with existing assignments, assessments, or resources.',
    );
  }

  await prisma.courseOffering.delete({ where: { id: offeringId } });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_OFFERING_DELETED',
    entityType: 'CourseOffering',
    entityId: offeringId,
    ipAddress,
  });

  return { success: true };
}

export async function assignOfferingTeacher(
  schoolId: string,
  offeringId: string,
  input: AssignOfferingTeacherInput,
  actorId: string,
  ipAddress: string | null,
): Promise<OfferingTeacherDto> {
  const [offering, teacher] = await Promise.all([
    prisma.courseOffering.findFirst({ where: { id: offeringId, schoolId } }),
    prisma.teacherProfile.findFirst({ where: { id: input.teacherId, schoolId } }),
  ]);

  if (!offering) throw new NotFoundError('Course offering not found.');
  if (!teacher) throw new NotFoundError('Teacher not found in this school.');

  const existingAssignment = await prisma.courseTeacher.findUnique({
    where: {
      schoolId_courseOfferingId_teacherId: {
        schoolId,
        courseOfferingId: offeringId,
        teacherId: input.teacherId,
      },
    },
  });
  if (existingAssignment) {
    throw new ConflictError('This teacher is already assigned to this course offering.');
  }

  const assignment = await prisma.courseTeacher.create({
    data: {
      schoolId,
      courseOfferingId: offeringId,
      teacherId: input.teacherId,
      role: input.role,
    },
    include: { teacher: true },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_TEACHER_ALLOCATED',
    entityType: 'CourseTeacher',
    entityId: assignment.id,
    delta: { offeringId, teacherId: input.teacherId, role: input.role },
    ipAddress,
  });

  return {
    allocationId: assignment.id,
    teacherId: assignment.teacherId,
    teacherName: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
    employeeId: assignment.teacher.employeeId,
    role: assignment.role,
  };
}

export async function removeOfferingTeacher(
  schoolId: string,
  offeringId: string,
  teacherId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<{ success: true }> {
  const assignment = await prisma.courseTeacher.findUnique({
    where: {
      schoolId_courseOfferingId_teacherId: {
        schoolId,
        courseOfferingId: offeringId,
        teacherId,
      },
    },
  });
  if (!assignment) {
    throw new NotFoundError('Teacher allocation not found.');
  }

  await prisma.courseTeacher.delete({
    where: { id: assignment.id },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_TEACHER_DEALLOCATED',
    entityType: 'CourseTeacher',
    entityId: assignment.id,
    delta: { offeringId, teacherId },
    ipAddress,
  });

  return { success: true };
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

export async function inviteSchoolUser(
  schoolId: string,
  input: InviteUserInput,
  actorId: string,
  ipAddress: string | null,
): Promise<UserInvitationDto> {
  const allowedRoles = ['TEACHER', 'STUDENT', 'PARENT'];
  if (!allowedRoles.includes(input.role)) {
    throw new BadRequestError(
      'School administrators can only provision TEACHER, STUDENT, or PARENT accounts.',
    );
  }

  const normalizedEmail = input.email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError('A user with this email address already exists.');
  }

  // Role-specific identifier validation
  let employeeId = input.employeeId?.trim();
  if (input.role === 'TEACHER') {
    if (!employeeId) {
      employeeId = `EMP-${Date.now().toString().slice(-6)}`;
    }
    const existingTeacher = await prisma.teacherProfile.findUnique({
      where: { schoolId_employeeId: { schoolId, employeeId } },
    });
    if (existingTeacher) {
      throw new ConflictError('A teacher with this employee ID already exists.');
    }
  }

  let studentIdNumber = input.studentIdNumber?.trim();
  if (input.role === 'STUDENT') {
    if (!studentIdNumber) {
      studentIdNumber = `STU-${Date.now().toString().slice(-6)}`;
    }
    const existingStudent = await prisma.studentProfile.findUnique({
      where: { schoolId_studentIdNumber: { schoolId, studentIdNumber } },
    });
    if (existingStudent) {
      throw new ConflictError('A student with this student ID already exists.');
    }
  }

  if (input.role === 'PARENT' && input.studentId) {
    const student = await prisma.studentProfile.findFirst({
      where: { id: input.studentId, schoolId },
    });
    if (!student) {
      throw new NotFoundError('Referenced student does not exist in this school.');
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // Generate secure unguessable placeholder password hash
    const placeholderHash = `!INVITED_PENDING_ACTIVATION_${crypto.randomBytes(16).toString('hex')}`;
    const user = await tx.user.create({
      data: {
        schoolId,
        email: normalizedEmail,
        role: input.role,
        status: 'INACTIVE',
        passwordHash: placeholderHash,
      },
    });

    if (input.role === 'TEACHER') {
      await tx.teacherProfile.create({
        data: {
          schoolId,
          userId: user.id,
          employeeId: employeeId!,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          specialization: input.specialization?.trim() ?? null,
        },
      });
    } else if (input.role === 'STUDENT') {
      const studentProfile = await tx.studentProfile.create({
        data: {
          schoolId,
          userId: user.id,
          studentIdNumber: studentIdNumber!,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          admissionDate: input.admissionDate ? new Date(input.admissionDate) : new Date(),
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          gender: input.gender?.trim() ?? null,
        },
      });

      if (input.sectionId) {
        const activeYear = await tx.academicYear.findFirst({
          where: { schoolId, status: 'ACTIVE' },
        });
        if (activeYear) {
          await tx.enrollment.create({
            data: {
              schoolId,
              studentId: studentProfile.id,
              sectionId: input.sectionId,
              academicYearId: activeYear.id,
              status: 'ACTIVE',
            },
          });
        }
      }
    } else if (input.role === 'PARENT' && input.studentId) {
      await tx.guardianRelationship.create({
        data: {
          schoolId,
          guardianUserId: user.id,
          studentId: input.studentId,
          relationshipType: 'LEGAL_GUARDIAN',
          isPrimaryContact: true,
          isVerified: false,
        },
      });
    }

    const invitationResult = await createInvitation({
      tx,
      schoolId,
      userId: user.id,
      email: user.email,
      role: user.role,
      invitedByUserId: actorId,
    });

    await recordAuditEvent({
      schoolId,
      actorId,
      action: AUDIT_ACTIONS.USER_INVITED,
      entityType: 'UserInvitation',
      entityId: invitationResult.invitation.id,
      delta: {
        email: user.email,
        role: user.role,
        firstName: input.firstName,
        lastName: input.lastName,
      },
      ipAddress,
    });

    const school = await tx.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    });

    return {
      invitation: invitationResult.invitation,
      rawToken: invitationResult.rawToken,
      invitationUrl: invitationResult.invitationUrl,
      schoolName: school?.name ?? null,
    };
  });

  const dispatchResult = await dispatchInvitationEmail({
    invitationId: result.invitation.id,
    rawToken: result.rawToken,
    invitationUrl: result.invitationUrl,
    recipientEmail: input.email,
    recipientName: `${input.firstName} ${input.lastName}`,
    role: input.role,
    schoolId,
    schoolName: result.schoolName,
    expiresAt: new Date(result.invitation.expiresAt),
    type: 'INVITATION_INITIAL',
  });

  result.invitation.deliveryStatus = dispatchResult.delivered ? 'SENT' : 'FAILED';
  result.invitation.deliveryError = dispatchResult.error ?? null;

  return result.invitation;
}

export async function listSchoolInvitations(
  schoolId: string,
  query: InvitationFilterQuery,
): Promise<UserInvitationDto[]> {
  return listInvitations({ schoolId, query });
}

export async function resendSchoolInvitation(
  schoolId: string,
  invitationId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<UserInvitationDto> {
  return resendInvitation({ invitationId, schoolId, actorId, ipAddress });
}

export async function revokeSchoolInvitation(
  schoolId: string,
  invitationId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<UserInvitationDto> {
  return revokeInvitation({ invitationId, schoolId, actorId, ipAddress });
}

export async function getSchoolOnboarding(schoolId: string): Promise<SchoolOnboardingStatusDto> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });
  if (!school) {
    throw new NotFoundError('School not found.');
  }

  const [
    academicYears,
    classes,
    subjects,
    teacherCount,
    teacherInvitedCount,
    studentCount,
    studentInvitedCount,
    parentCount,
    parentInvitedCount,
    latestProgressAudit,
    completionAudit,
  ] = await Promise.all([
    prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { sections: true } } },
    }),
    prisma.class.findMany({
      where: { schoolId },
      orderBy: { sortOrder: 'asc' },
      include: {
        sections: {
          include: {
            academicYear: { select: { name: true } },
            _count: { select: { enrollments: true } },
          },
        },
      },
    }),
    prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    }),
    prisma.teacherProfile.count({ where: { schoolId } }),
    prisma.userInvitation.count({
      where: { schoolId, role: 'TEACHER', status: { in: ['PENDING', 'ACCEPTED'] } },
    }),
    prisma.studentProfile.count({ where: { schoolId, deletedAt: null } }),
    prisma.userInvitation.count({
      where: { schoolId, role: 'STUDENT', status: { in: ['PENDING', 'ACCEPTED'] } },
    }),
    prisma.guardianRelationship.count({ where: { schoolId } }),
    prisma.userInvitation.count({
      where: { schoolId, role: 'PARENT', status: { in: ['PENDING', 'ACCEPTED'] } },
    }),
    prisma.auditLog.findFirst({
      where: { schoolId, action: 'SCHOOL_ONBOARDING_PROGRESS_SAVED' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.findFirst({
      where: { schoolId, action: 'SCHOOL_ONBOARDING_COMPLETED' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const activeYear = academicYears.find((y) => y.status === 'ACTIVE') ?? null;
  const totalSections = classes.reduce((acc, c) => acc + c.sections.length, 0);

  const isProfileComplete = Boolean(school.name && school.contactEmail && school.code);
  const isAcademicYearComplete = academicYears.length > 0;
  const isClassesSectionsComplete = classes.length > 0 && totalSections > 0;
  const isSubjectsComplete = subjects.length > 0;
  const isTeachersComplete = teacherCount > 0 || teacherInvitedCount > 0;
  const isStudentsComplete = studentCount > 0 || studentInvitedCount > 0;
  const isParentsComplete = parentCount > 0 || parentInvitedCount > 0;

  const stepsMap: Record<string, boolean> = {
    profile: isProfileComplete,
    'academic-year': isAcademicYearComplete,
    'classes-sections': isClassesSectionsComplete,
    subjects: isSubjectsComplete,
    teachers: isTeachersComplete,
    students: isStudentsComplete,
    parents: isParentsComplete,
  };

  const allStepKeys: OnboardingStepKey[] = [
    'profile',
    'academic-year',
    'classes-sections',
    'subjects',
    'teachers',
    'students',
    'parents',
  ];

  const completedSteps: OnboardingStepKey[] = allStepKeys.filter((k) => stepsMap[k]);
  const pendingSteps: OnboardingStepKey[] = allStepKeys.filter((k) => !stepsMap[k]);

  const isFormallyCompleted = Boolean(completionAudit);
  const completionPercentage = isFormallyCompleted
    ? 100
    : Math.round((completedSteps.length / allStepKeys.length) * 100);

  const isComplete = isFormallyCompleted || completedSteps.length === allStepKeys.length;

  let currentStep: OnboardingStepKey = 'profile';
  if (latestProgressAudit?.delta && typeof latestProgressAudit.delta === 'object') {
    const savedStep = (latestProgressAudit.delta as Record<string, unknown>)[
      'step'
    ] as OnboardingStepKey;
    if (allStepKeys.includes(savedStep) || savedStep === 'summary') {
      currentStep = savedStep;
    }
  } else if (pendingSteps.length > 0) {
    currentStep = pendingSteps[0] ?? 'profile';
  } else {
    currentStep = 'summary';
  }

  return {
    schoolId: school.id,
    schoolName: school.name,
    isComplete,
    completionPercentage,
    currentStep,
    completedSteps,
    pendingSteps,
    steps: {
      profile: {
        isComplete: isProfileComplete,
        name: school.name,
        code: school.code,
        subdomain: school.subdomain,
        contactEmail: school.contactEmail,
        status: school.status,
      },
      academicYear: {
        isComplete: isAcademicYearComplete,
        count: academicYears.length,
        activeYear: activeYear
          ? {
              id: activeYear.id,
              name: activeYear.name,
              startDate: activeYear.startDate.toISOString().slice(0, 10),
              endDate: activeYear.endDate.toISOString().slice(0, 10),
              status: activeYear.status,
              sectionCount: activeYear._count.sections,
            }
          : null,
      },
      classesSections: {
        isComplete: isClassesSectionsComplete,
        classCount: classes.length,
        sectionCount: totalSections,
      },
      subjects: {
        isComplete: isSubjectsComplete,
        count: subjects.length,
      },
      teachers: {
        isComplete: isTeachersComplete,
        count: teacherCount,
        invitedCount: teacherInvitedCount,
      },
      students: {
        isComplete: isStudentsComplete,
        count: studentCount,
      },
      parents: {
        isComplete: isParentsComplete,
        count: parentCount,
        invitedCount: parentInvitedCount,
      },
    },
    summary: {
      totalStudents: studentCount,
      totalTeachers: teacherCount + teacherInvitedCount,
      totalClasses: classes.length,
      totalSections,
      totalSubjects: subjects.length,
      hasActiveYear: Boolean(activeYear),
    },
    lastSavedAt: latestProgressAudit?.createdAt.toISOString() ?? null,
  };
}

export async function saveOnboardingProgress(
  schoolId: string,
  input: SaveOnboardingProgressInput,
  actorId: string,
  ipAddress: string | null,
): Promise<SaveOnboardingProgressResultDto> {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    throw new NotFoundError('School not found.');
  }

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_ONBOARDING_PROGRESS_SAVED',
    entityType: 'School',
    entityId: schoolId,
    delta: {
      step: input.step,
      notes: input.notes,
    },
    ipAddress,
  });

  return {
    success: true,
    savedStep: input.step as OnboardingStepKey,
    savedAt: new Date().toISOString(),
  };
}

export async function completeSchoolOnboarding(
  schoolId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<CompleteOnboardingResultDto> {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    throw new NotFoundError('School not found.');
  }

  const [academicYearCount, classCount, sectionCount] = await Promise.all([
    prisma.academicYear.count({ where: { schoolId } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.section.count({ where: { schoolId } }),
  ]);

  if (academicYearCount === 0 || classCount === 0 || sectionCount === 0) {
    throw new BadRequestError(
      'Cannot complete onboarding without at least one Academic Year, Class, and Section configured.',
    );
  }

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_ONBOARDING_COMPLETED',
    entityType: 'School',
    entityId: schoolId,
    delta: { completedBy: actorId },
    ipAddress,
  });

  return {
    success: true,
    completedAt: new Date().toISOString(),
  };
}
