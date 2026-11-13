import crypto from 'node:crypto';
import type {
  AuditLogDto,
  PlatformOverviewDto,
  ProvisionSchoolResultDto,
  SchoolDetailDto,
  SchoolSummaryDto,
  UserInvitationDto,
} from '@fsd-sdg4/contracts';
import type { SchoolStatus } from '@prisma/client';
import type {
  CreateSchoolInput,
  InvitationFilterQuery,
  UpdateSchoolInput,
} from '@fsd-sdg4/validation';
import { prisma } from '../../shared/db/prisma.js';
import { ConflictError, NotFoundError } from '../../shared/errors/appError.js';
import { AUDIT_ACTIONS, recordAuditEvent } from '../audit/audit.service.js';
import {
  createInvitation,
  listInvitations,
  resendInvitation,
  revokeInvitation,
} from '../invitations/invitation.service.js';
import { dispatchInvitationEmail } from '../mail/mail.service.js';

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
    allSchools,
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
    prisma.school.findMany({
      where: { deletedAt: null },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const roleMap: Record<string, number> = {};
  for (const group of usersGroupedByRole) {
    roleMap[group.role] = group._count.id;
  }

  const trendMap = new Map<string, number>();
  for (const s of allSchools) {
    const key = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
      s.createdAt,
    );
    trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
  }
  const registrationTrends = Array.from(trendMap.entries()).map(([period, count]) => ({
    period,
    count,
  }));

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
    registrationTrends,
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

export async function listSchools(
  search?: string,
  status?: SchoolStatus,
): Promise<SchoolSummaryDto[]> {
  const schools = await prisma.school.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status } : {}),
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
          sections: true,
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

  const recentAuditLogs = await prisma.auditLog.findMany({
    where: { schoolId: id },
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: {
      actor: {
        select: { email: true },
      },
    },
  });

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
    sectionCount: school._count.sections,
    staffCount: school._count.teacherProfiles,
    activeAcademicYear: school.academicYears[0]?.name ?? null,
    recentAuditLogs: recentAuditLogs.map((log) => ({
      id: log.id,
      schoolId: log.schoolId,
      actorId: log.actorId,
      actorEmail: log.actor?.email ?? null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

export async function createSchool(
  input: CreateSchoolInput,
  actorId: string,
  ipAddress: string | null,
): Promise<ProvisionSchoolResultDto> {
  const existing = await prisma.school.findFirst({
    where: {
      OR: [{ code: input.code }, { subdomain: input.subdomain }],
    },
  });

  if (existing) {
    throw new ConflictError('A school with this code or subdomain already exists.');
  }

  if (input.adminEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.adminEmail.toLowerCase().trim() },
    });
    if (existingUser) {
      throw new ConflictError('A user with this administrator email already exists.');
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const createdSchool = await tx.school.create({
      data: {
        name: input.name,
        code: input.code,
        subdomain: input.subdomain,
        contactEmail: input.contactEmail,
        status: 'ACTIVE',
      },
    });

    let adminInvitation:
      { invitation: UserInvitationDto; rawToken: string; invitationUrl: string } | undefined;

    if (input.adminEmail) {
      // Secure random placeholder password hash - zero default plaintext passwords
      const placeholderHash = `!INVITED_PENDING_ACTIVATION_${crypto.randomBytes(16).toString('hex')}`;
      const initialAdmin = await tx.user.create({
        data: {
          schoolId: createdSchool.id,
          email: input.adminEmail.toLowerCase().trim(),
          role: 'SCHOOL_ADMIN',
          status: 'INACTIVE',
          passwordHash: placeholderHash,
        },
      });

      adminInvitation = await createInvitation({
        tx,
        schoolId: createdSchool.id,
        userId: initialAdmin.id,
        email: initialAdmin.email,
        role: 'SCHOOL_ADMIN',
        invitedByUserId: actorId,
      });

      await recordAuditEvent({
        schoolId: createdSchool.id,
        actorId,
        action: AUDIT_ACTIONS.TENANT_INITIAL_ADMIN_INVITED,
        entityType: 'UserInvitation',
        entityId: adminInvitation.invitation.id,
        delta: {
          adminEmail: initialAdmin.email,
          role: 'SCHOOL_ADMIN',
          userId: initialAdmin.id,
        },
        ipAddress,
      });
    }

    await recordAuditEvent({
      schoolId: createdSchool.id,
      actorId,
      action: AUDIT_ACTIONS.PLATFORM_TENANT_PROVISIONED,
      entityType: 'School',
      entityId: createdSchool.id,
      delta: {
        code: createdSchool.code,
        subdomain: createdSchool.subdomain,
        hasInitialAdmin: Boolean(input.adminEmail),
      },
      ipAddress,
    });

    return {
      createdSchool,
      adminInvitation,
    };
  });

  if (result.adminInvitation && input.adminEmail) {
    const dispatchResult = await dispatchInvitationEmail({
      invitationId: result.adminInvitation.invitation.id,
      rawToken: result.adminInvitation.rawToken,
      invitationUrl: result.adminInvitation.invitationUrl,
      recipientEmail: input.adminEmail,
      recipientName:
        input.adminFirstName && input.adminLastName
          ? `${input.adminFirstName} ${input.adminLastName}`
          : null,
      role: 'SCHOOL_ADMIN',
      schoolId: result.createdSchool.id,
      schoolName: result.createdSchool.name,
      expiresAt: new Date(result.adminInvitation.invitation.expiresAt),
      type: 'INVITATION_INITIAL',
    });

    result.adminInvitation.invitation.deliveryStatus = dispatchResult.delivered ? 'SENT' : 'FAILED';
    result.adminInvitation.invitation.deliveryError = dispatchResult.error ?? null;
  }

  return {
    id: result.createdSchool.id,
    name: result.createdSchool.name,
    code: result.createdSchool.code,
    subdomain: result.createdSchool.subdomain,
    contactEmail: result.createdSchool.contactEmail,
    status: result.createdSchool.status,
    createdAt: result.createdSchool.createdAt.toISOString(),
    userCount: result.adminInvitation ? 1 : 0,
    studentCount: 0,
    adminEmail: input.adminEmail ?? undefined,
    invitationUrl: result.adminInvitation?.invitationUrl,
    invitationId: result.adminInvitation?.invitation.id,
  };
}

export async function listPlatformInvitations(
  query: InvitationFilterQuery,
): Promise<UserInvitationDto[]> {
  return listInvitations({ query });
}

export async function resendPlatformInvitation(
  invitationId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<UserInvitationDto> {
  return resendInvitation({ invitationId, actorId, ipAddress });
}

export async function revokePlatformInvitation(
  invitationId: string,
  actorId: string,
  ipAddress: string | null,
): Promise<UserInvitationDto> {
  return revokeInvitation({ invitationId, actorId, ipAddress });
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

export async function listPlatformAuditLogs(
  actionFilter?: string,
  schoolId?: string,
): Promise<AuditLogDto[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      ...(actionFilter ? { action: { contains: actionFilter, mode: 'insensitive' as const } } : {}),
      ...(schoolId ? { schoolId } : {}),
    },
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
