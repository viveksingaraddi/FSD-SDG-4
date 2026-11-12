import type {
  AcademicYearDto,
  AuditLogDto,
  ClassDto,
  SchoolOverviewDto,
  SchoolSettingsDto,
  SectionDto,
  StaffMemberDto,
  StudentDirectoryDto,
  SubjectDto,
} from '@fsd-sdg4/contracts';
import type {
  CreateAcademicYearInput,
  CreateClassInput,
  CreateSectionInput,
  CreateStaffInput,
  CreateStudentInput,
  CreateSubjectInput,
  UpdateSchoolSettingsInput,
} from '@fsd-sdg4/validation';
import { prisma } from '../../shared/db/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors/appError.js';
import { hashPassword } from '../../shared/security/password.js';
import { recordAuditEvent } from '../audit/audit.service.js';

export async function getSchoolOverview(schoolId: string): Promise<SchoolOverviewDto> {
  const [
    school,
    activeYear,
    totalStudents,
    totalStaff,
    totalClasses,
    totalSections,
    activeSupportPlans,
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
  ]);

  if (!school) {
    throw new NotFoundError('School not found.');
  }

  return {
    schoolName: school.name,
    activeAcademicYear: activeYear?.name ?? null,
    totalStudents,
    totalStaff,
    totalClasses,
    totalSections,
    activeSupportPlans,
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

export async function listStaff(schoolId: string): Promise<StaffMemberDto[]> {
  const rows = await prisma.teacherProfile.findMany({
    where: { schoolId },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      user: { select: { email: true, status: true } },
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
  }));
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
  };
}

export async function updateStaffStatus(
  schoolId: string,
  staffProfileId: string,
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED',
  actorId: string,
  ipAddress: string | null,
): Promise<StaffMemberDto> {
  const profile = await prisma.teacherProfile.findFirst({
    where: { id: staffProfileId, schoolId },
    include: { user: true },
  });

  if (!profile) {
    throw new NotFoundError('Staff member not found.');
  }

  const updatedUser = await prisma.user.update({
    where: { id: profile.userId },
    data: { status },
  });

  await recordAuditEvent({
    schoolId,
    actorId,
    action: 'SCHOOL_STAFF_STATUS_UPDATED',
    entityType: 'TeacherProfile',
    entityId: profile.id,
    delta: { status },
    ipAddress,
  });

  return {
    id: profile.id,
    userId: profile.userId,
    employeeId: profile.employeeId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: updatedUser.email,
    specialization: profile.specialization,
    status: updatedUser.status,
  };
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
