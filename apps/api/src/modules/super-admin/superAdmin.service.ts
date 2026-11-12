import type {
  AuditLogDto,
  PlatformOverviewDto,
  SchoolDetailDto,
  SchoolSummaryDto,
} from '@fsd-sdg4/contracts';
import type { CreateSchoolInput, UpdateSchoolInput } from '@fsd-sdg4/validation';
import { prisma } from '../../shared/db/prisma.js';
import { ConflictError, NotFoundError } from '../../shared/errors/appError.js';
import { recordAuditEvent } from '../audit/audit.service.js';

export async function getPlatformOverview(): Promise<PlatformOverviewDto> {
  const [
    totalSchools,
    activeSchools,
    suspendedSchools,
    archivedSchools,
    totalUsers,
    recentAuditEvents,
    usersGroupedByRole,
    totalClasses,
    totalSections,
  ] = await Promise.all([
    prisma.school.count({ where: { deletedAt: null } }),
    prisma.school.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    prisma.school.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
    prisma.school.count({ where: { deletedAt: null, status: 'ARCHIVED' } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.auditLog.count(),
    prisma.user.groupBy({
      by: ['role'],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    prisma.class.count(),
    prisma.section.count(),
  ]);

  const roleMap: Record<string, number> = {};
  for (const group of usersGroupedByRole) {
    roleMap[group.role] = group._count.id;
  }

  const usersByRole = {
    teachers: roleMap['TEACHER'] ?? 0,
    students: roleMap['STUDENT'] ?? 0,
    schoolAdmins: roleMap['SCHOOL_ADMIN'] ?? 0,
    parents: roleMap['PARENT'] ?? 0,
    superAdmins: roleMap['SUPER_ADMIN'] ?? 0,
  };

  const schoolsAnalytics = {
    active: activeSchools,
    suspended: suspendedSchools,
    archived: archivedSchools,
    totalClasses,
    totalSections,
  };

  const alerts = [];
  if (suspendedSchools > 0) {
    alerts.push({
      id: 'alert-suspended-tenants',
      level: 'warning' as const,
      title: `${suspendedSchools} Suspended School Tenant${suspendedSchools > 1 ? 's' : ''}`,
      description: 'Tenants under administrative suspension require compliance inspection.',
      actionUrl: '/super-admin/schools',
      actionLabel: 'Inspect Tenants',
    });
  }

  if (archivedSchools > 0) {
    alerts.push({
      id: 'alert-archived-tenants',
      level: 'info' as const,
      title: `${archivedSchools} Archived School Tenant${archivedSchools > 1 ? 's' : ''}`,
      description: 'Archived tenant data is stored under immutable regulatory retention policy.',
      actionUrl: '/super-admin/schools',
      actionLabel: 'View Directory',
    });
  }

  return {
    totalSchools,
    activeSchools,
    suspendedSchools,
    archivedSchools,
    totalUsers,
    recentAuditEvents,
    usersByRole,
    schoolsAnalytics,
    alerts,
  };
}

export async function listSchools(search?: string): Promise<SchoolSummaryDto[]> {
  const schools = await prisma.school.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { subdomain: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          users: true,
          studentProfiles: true,
        },
      },
    },
  });

  return schools.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    subdomain: s.subdomain,
    contactEmail: s.contactEmail,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    userCount: s._count.users,
    studentCount: s._count.studentProfiles,
  }));
}

export async function getSchoolById(id: string): Promise<SchoolDetailDto> {
  const school = await prisma.school.findFirst({
    where: { id, deletedAt: null },
    include: {
      _count: {
        select: {
          users: true,
          studentProfiles: true,
          classes: true,
          teacherProfiles: true,
        },
      },
      academicYears: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  });

  if (!school) {
    throw new NotFoundError('School tenant was not found.');
  }

  return {
    id: school.id,
    name: school.name,
    code: school.code,
    subdomain: school.subdomain,
    contactEmail: school.contactEmail,
    status: school.status,
    createdAt: school.createdAt.toISOString(),
    userCount: school._count.users,
    studentCount: school._count.studentProfiles,
    classCount: school._count.classes,
    staffCount: school._count.teacherProfiles,
    activeAcademicYear: school.academicYears[0]?.name ?? null,
  };
}

export async function createSchool(
  input: CreateSchoolInput,
  actorId: string,
  ipAddress: string | null,
): Promise<SchoolSummaryDto> {
  const existing = await prisma.school.findFirst({
    where: {
      OR: [{ code: input.code }, { subdomain: input.subdomain }],
    },
  });

  if (existing) {
    throw new ConflictError('A school with this code or subdomain already exists.');
  }

  const created = await prisma.school.create({
    data: {
      name: input.name,
      code: input.code,
      subdomain: input.subdomain,
      contactEmail: input.contactEmail,
      status: 'ACTIVE',
    },
  });

  await recordAuditEvent({
    schoolId: created.id,
    actorId,
    action: 'PLATFORM_SCHOOL_CREATED',
    entityType: 'School',
    entityId: created.id,
    delta: { code: created.code, subdomain: created.subdomain },
    ipAddress,
  });

  return {
    id: created.id,
    name: created.name,
    code: created.code,
    subdomain: created.subdomain,
    contactEmail: created.contactEmail,
    status: created.status,
    createdAt: created.createdAt.toISOString(),
    userCount: 0,
    studentCount: 0,
  };
}

export async function updateSchool(
  id: string,
  input: UpdateSchoolInput,
  actorId: string,
  ipAddress: string | null,
): Promise<SchoolSummaryDto> {
  const existing = await prisma.school.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    throw new NotFoundError('School tenant was not found.');
  }

  const updated = await prisma.school.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    include: {
      _count: {
        select: { users: true, studentProfiles: true },
      },
    },
  });

  await recordAuditEvent({
    schoolId: updated.id,
    actorId,
    action: 'PLATFORM_SCHOOL_UPDATED',
    entityType: 'School',
    entityId: updated.id,
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
    createdAt: updated.createdAt.toISOString(),
    userCount: updated._count.users,
    studentCount: updated._count.studentProfiles,
  };
}

export async function listPlatformAuditLogs(actionFilter?: string): Promise<AuditLogDto[]> {
  const logs = await prisma.auditLog.findMany({
    ...(actionFilter
      ? { where: { action: { contains: actionFilter, mode: 'insensitive' as const } } }
      : {}),
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      actor: {
        select: { email: true },
      },
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
