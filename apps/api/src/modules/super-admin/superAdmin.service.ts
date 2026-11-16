import crypto from 'node:crypto';
import type {
  AuditLogDto,
  PaginatedUsersResultDto,
  PlatformAdoptionMetricsDto,
  PlatformOperationalStatsDto,
  PlatformOverviewDto,
  PlatformSettingsDto,
  ProvisionSchoolResultDto,
  SchoolDetailDto,
  SchoolSummaryDto,
  UserDirectoryItemDto,
  UserInvitationDto,
  UserLifecycleDetailDto,
} from '@fsd-sdg4/contracts';
import type { Prisma, SchoolStatus, UserRole, UserStatus } from '@prisma/client';
import type {
  CreateSchoolInput,
  InvitationFilterQuery,
  SuperAdminInviteAdminInput,
  UpdateSchoolInput,
  UserFilterQuery,
} from '@fsd-sdg4/validation';
import { prisma } from '../../shared/db/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors/appError.js';
import { AUDIT_ACTIONS, recordAuditEvent } from '../audit/audit.service.js';
import {
  createInvitation,
  listInvitations,
  resendInvitation,
  revokeInvitation,
} from '../invitations/invitation.service.js';
import { dispatchInvitationEmail } from '../mail/mail.service.js';

export async function getPlatformOverview(
  period?: 'all' | '30d' | '90d' | 'year',
): Promise<PlatformOverviewDto> {
  const now = new Date();
  let dateBoundary: Date | null = null;
  if (period === '30d') {
    dateBoundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === '90d') {
    dateBoundary = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (period === 'year') {
    dateBoundary = new Date(now.getFullYear(), 0, 1);
  }

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
    totalStudentsAcrossSchools,
    totalTeachersAcrossSchools,
    schoolsWithActiveYear,
    allInvitationsRaw,
    totalCourseOfferings,
    totalAssignments,
    totalAssessments,
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
      where: {
        deletedAt: null,
        ...(dateBoundary ? { createdAt: { gte: dateBoundary } } : {}),
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.studentProfile.count({ where: { deletedAt: null } }),
    prisma.teacherProfile.count(),
    prisma.school.count({
      where: {
        deletedAt: null,
        academicYears: { some: { status: 'ACTIVE' } },
      },
    }),
    prisma.userInvitation.findMany({
      select: {
        id: true,
        schoolId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    prisma.courseOffering.count(),
    prisma.assignment.count(),
    prisma.assessment.count(),
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
  const registrationTrends = Array.from(trendMap.entries()).map(([periodLabel, count]) => ({
    period: periodLabel,
    count,
  }));

  const usersByRole = {
    teachers: roleMap['TEACHER'] ?? 0,
    students: roleMap['STUDENT'] ?? 0,
    schoolAdmins: roleMap['SCHOOL_ADMIN'] ?? 0,
    parents: roleMap['PARENT'] ?? 0,
    superAdmins: roleMap['SUPER_ADMIN'] ?? 0,
  };

  const STATE_RANK: Record<string, number> = {
    ACCEPTED: 4,
    PENDING: 3,
    EXPIRED: 2,
    REVOKED: 1,
  };
  const bestInviteStatusByRecipient = new Map<string, string>();
  for (const inv of allInvitationsRaw) {
    let effectiveStatus = inv.status;
    if (inv.status === 'PENDING' && now > inv.expiresAt) {
      effectiveStatus = 'EXPIRED';
    }
    const key = `${(inv.schoolId ?? 'platform').toLowerCase()}:${inv.email.trim().toLowerCase()}:${inv.role}`;
    const current = bestInviteStatusByRecipient.get(key);
    if (!current) {
      bestInviteStatusByRecipient.set(key, effectiveStatus);
    } else {
      const currentRank = STATE_RANK[current] ?? 0;
      const newRank = STATE_RANK[effectiveStatus] ?? 0;
      if (newRank > currentRank) {
        bestInviteStatusByRecipient.set(key, effectiveStatus);
      }
    }
  }

  let acceptedInvitations = 0;
  let pendingInvitations = 0;
  let revokedInvitations = 0;
  let expiredInvitations = 0;

  for (const status of bestInviteStatusByRecipient.values()) {
    if (status === 'ACCEPTED') acceptedInvitations++;
    else if (status === 'PENDING') pendingInvitations++;
    else if (status === 'REVOKED') revokedInvitations++;
    else if (status === 'EXPIRED') expiredInvitations++;
  }

  const totalInvitations = bestInviteStatusByRecipient.size;

  const averageStudentsPerSchool =
    activeSchools > 0 ? Math.round(totalStudentsAcrossSchools / activeSchools) : 0;
  const averageTeachersPerSchool =
    activeSchools > 0 ? Math.round(totalTeachersAcrossSchools / activeSchools) : 0;
  const invitationAcceptanceRate =
    totalInvitations > 0 ? Math.round((acceptedInvitations / totalInvitations) * 100) : 0;

  const adoptionMetrics: PlatformAdoptionMetricsDto = {
    schoolsWithActiveYear,
    totalStudentsAcrossSchools,
    averageStudentsPerSchool,
    averageTeachersPerSchool,
    invitationAcceptanceRate,
  };

  const operationalStats: PlatformOperationalStatsDto = {
    totalCourseOfferings,
    totalAssignments,
    totalAssessments,
    invitations: {
      total: totalInvitations,
      accepted: acceptedInvitations,
      pending: pendingInvitations,
      revoked: revokedInvitations,
      expired: expiredInvitations,
    },
  };

  const schoolsAnalytics = {
    active: activeSchools,
    suspended: suspendedSchools,
    archived: archivedSchools,
    totalClasses,
    totalSections,
    totalStudents: totalStudentsAcrossSchools,
    totalTeachers: totalTeachersAcrossSchools,
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
    adoptionMetrics,
    operationalStats,
    alerts,
    period: period ?? 'all',
  };
}

export async function getPlatformSettings(): Promise<PlatformSettingsDto> {
  return {
    policies: {
      sessionPolicy: {
        maxAgeSeconds: 7 * 24 * 60 * 60,
        sameSite: 'lax',
        secure: process.env['NODE_ENV'] === 'production',
        httpOnly: true,
      },
      csrfProtection: {
        enabled: true,
        headerName: 'X-CSRF-Token',
      },
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true,
        hashingAlgorithm: 'Argon2id',
      },
      tenantIsolation: {
        model: 'Multi-Tenant Shared Schema with Tenant Discriminator (school_id)',
        zeroTrust: true,
        enforcementLayer: 'Session Context resolveTenantSchoolId(req) & Prisma Scoped Queries',
      },
      rateLimiting: {
        globalLimit: 100,
        authLimit: 10,
      },
      emailDelivery: {
        provider: 'Official FSD-SDG-4 Gmail SMTP (Nodemailer TLS)',
        secureTls: true,
      },
    },
    version: '1.0.0',
    environment: process.env['NODE_ENV'] ?? 'development',
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
  actionFilter?: string | undefined,
  schoolId?: string | undefined,
  category?: ('ALL' | 'AUTH' | 'SCHOOL' | 'ACADEMIC' | 'USER' | 'SETTINGS') | undefined,
  startDate?: string | undefined,
  endDate?: string | undefined,
): Promise<AuditLogDto[]> {
  const categoryFilters: Record<string, string[]> = {
    AUTH: ['AUTH_', 'LOGIN', 'SESSION', 'PASSWORD'],
    SCHOOL: ['SCHOOL_', 'PLATFORM_TENANT_', 'PLATFORM_SCHOOL_'],
    ACADEMIC: ['ACADEMIC', 'CLASS', 'SECTION', 'SUBJECT', 'OFFERING'],
    USER: ['USER_', 'TEACHER_', 'STUDENT_', 'STAFF_', 'GUARDIAN_', 'INVITATION_'],
    SETTINGS: ['SETTINGS', 'POLICY', 'PREFERENCE'],
  };

  const actionConditions: Array<{ action: { contains: string; mode: 'insensitive' } }> = [];
  if (actionFilter) {
    actionConditions.push({ action: { contains: actionFilter, mode: 'insensitive' } });
  }

  const categoryMatches = category && category !== 'ALL' ? categoryFilters[category] : undefined;

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(actionFilter ? { action: { contains: actionFilter, mode: 'insensitive' as const } } : {}),
      ...(schoolId ? { schoolId } : {}),
      ...(categoryMatches
        ? {
            OR: categoryMatches.map((prefix) => ({
              action: { contains: prefix, mode: 'insensitive' as const },
            })),
          }
        : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      actor: {
        select: { email: true },
      },
    },
  });

  return logs.map((log) => {
    // Redact sensitive secrets from delta if present
    let sanitizedDelta: Record<string, unknown> | null = null;
    if (log.delta && typeof log.delta === 'object' && !Array.isArray(log.delta)) {
      sanitizedDelta = { ...(log.delta as Record<string, unknown>) };
      for (const secretKey of ['password', 'passwordHash', 'token', 'rawToken', 'cookie']) {
        if (secretKey in sanitizedDelta) {
          sanitizedDelta[secretKey] = '[REDACTED]';
        }
      }
    }

    return {
      id: log.id,
      schoolId: log.schoolId,
      actorId: log.actorId,
      actorEmail: log.actor?.email ?? null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      delta: sanitizedDelta,
      createdAt: log.createdAt.toISOString(),
    };
  });
}

// ─── Platform User Lifecycle Management (Task 13) ──────────────────────────

export async function listPlatformUsers(query: UserFilterQuery): Promise<PaginatedUsersResultDto> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 25;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    ...(query.schoolId ? { schoolId: query.schoolId } : {}),
    ...(query.role && query.role !== 'ALL' ? { role: query.role as UserRole } : {}),
    ...(query.status && query.status !== 'ALL' ? { status: query.status as UserStatus } : {}),
    ...(query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' as const } },
            {
              teacherProfile: {
                OR: [
                  { firstName: { contains: query.search, mode: 'insensitive' as const } },
                  { lastName: { contains: query.search, mode: 'insensitive' as const } },
                  { employeeId: { contains: query.search, mode: 'insensitive' as const } },
                ],
              },
            },
            {
              studentProfile: {
                OR: [
                  { firstName: { contains: query.search, mode: 'insensitive' as const } },
                  { lastName: { contains: query.search, mode: 'insensitive' as const } },
                  { studentIdNumber: { contains: query.search, mode: 'insensitive' as const } },
                ],
              },
            },
          ],
        }
      : {}),
    ...(query.invitationStatus && query.invitationStatus !== 'ALL'
      ? query.invitationStatus === 'NONE'
        ? { invitations: { none: {} } }
        : { invitations: { some: { status: query.invitationStatus } } }
      : {}),
  };

  let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: query.sortOrder ?? 'desc' };
  if (query.sortBy === 'email') {
    orderBy = { email: query.sortOrder ?? 'asc' };
  } else if (query.sortBy === 'role') {
    orderBy = { role: query.sortOrder ?? 'asc' };
  } else if (query.sortBy === 'status') {
    orderBy = { status: query.sortOrder ?? 'asc' };
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        school: { select: { id: true, name: true } },
        teacherProfile: { select: { firstName: true, lastName: true, employeeId: true } },
        studentProfile: { select: { firstName: true, lastName: true, studentIdNumber: true } },
        invitations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            deliveryStatus: true,
            expiresAt: true,
            acceptedAt: true,
          },
        },
      },
    }),
  ]);

  const items: UserDirectoryItemDto[] = users.map((u) => {
    let firstName: string | null = null;
    let lastName: string | null = null;
    let identifier: string | null = null;

    if (u.teacherProfile) {
      firstName = u.teacherProfile.firstName;
      lastName = u.teacherProfile.lastName;
      identifier = u.teacherProfile.employeeId;
    } else if (u.studentProfile) {
      firstName = u.studentProfile.firstName;
      lastName = u.studentProfile.lastName;
      identifier = u.studentProfile.studentIdNumber;
    }

    const displayName =
      firstName && lastName ? `${firstName} ${lastName}`.trim() : u.email.split('@')[0] || u.email;

    const latestInv = u.invitations[0];

    return {
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      schoolId: u.schoolId,
      schoolName: u.school?.name ?? null,
      firstName,
      lastName,
      displayName,
      identifier,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
      invitationStatus: latestInv ? latestInv.status : 'NONE',
      invitationId: latestInv?.id ?? null,
      invitationExpiresAt: latestInv ? latestInv.expiresAt.toISOString() : null,
      invitationDeliveryStatus: latestInv?.deliveryStatus ?? null,
    };
  });

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getPlatformUserById(userId: string): Promise<UserLifecycleDetailDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      school: { select: { id: true, name: true } },
      teacherProfile: {
        include: {
          _count: { select: { courseAssignments: true } },
        },
      },
      studentProfile: {
        include: {
          _count: { select: { enrollments: true } },
          enrollments: {
            where: { status: 'ACTIVE' },
            include: { section: true },
            take: 1,
          },
        },
      },
      guardianLinks: {
        include: {
          student: true,
        },
      },
      invitations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { actor: { select: { email: true } } },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User was not found.');
  }

  let firstName: string | null = null;
  let lastName: string | null = null;
  let identifier: string | null = null;

  if (user.teacherProfile) {
    firstName = user.teacherProfile.firstName;
    lastName = user.teacherProfile.lastName;
    identifier = user.teacherProfile.employeeId;
  } else if (user.studentProfile) {
    firstName = user.studentProfile.firstName;
    lastName = user.studentProfile.lastName;
    identifier = user.studentProfile.studentIdNumber;
  }

  const displayName =
    firstName && lastName
      ? `${firstName} ${lastName}`.trim()
      : user.email.split('@')[0] || user.email;

  const latestInv = user.invitations[0];

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    schoolId: user.schoolId,
    schoolName: user.school?.name ?? null,
    firstName,
    lastName,
    displayName,
    identifier,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    invitationStatus: latestInv ? latestInv.status : 'NONE',
    invitationId: latestInv?.id ?? null,
    invitationExpiresAt: latestInv ? latestInv.expiresAt.toISOString() : null,
    invitationDeliveryStatus: latestInv?.deliveryStatus ?? null,
    teacherProfile: user.teacherProfile
      ? {
          id: user.teacherProfile.id,
          employeeId: user.teacherProfile.employeeId,
          specialization: user.teacherProfile.specialization,
          allocationCount: user.teacherProfile._count.courseAssignments,
        }
      : null,
    studentProfile: user.studentProfile
      ? {
          id: user.studentProfile.id,
          studentIdNumber: user.studentProfile.studentIdNumber,
          admissionDate: user.studentProfile.admissionDate.toISOString().slice(0, 10),
          dateOfBirth: user.studentProfile.dateOfBirth
            ? user.studentProfile.dateOfBirth.toISOString().slice(0, 10)
            : null,
          gender: user.studentProfile.gender,
          currentSection: user.studentProfile.enrollments[0]?.section?.name ?? null,
          enrollmentCount: user.studentProfile._count.enrollments,
        }
      : null,
    guardianRelationships: user.guardianLinks.map((gl) => ({
      id: gl.id,
      studentId: gl.studentId,
      studentName: `${gl.student.firstName} ${gl.student.lastName}`.trim(),
      studentIdNumber: gl.student.studentIdNumber,
      relationshipType: gl.relationshipType,
      isPrimaryContact: gl.isPrimaryContact,
      isVerified: gl.isVerified,
    })),
    recentAuditLogs: user.auditLogs.map((log) => ({
      id: log.id,
      schoolId: log.schoolId,
      actorId: log.actorId,
      actorEmail: log.actor?.email ?? null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      delta: (log.delta as Record<string, unknown>) ?? null,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

export async function inviteSchoolAdministrator(
  input: SuperAdminInviteAdminInput,
  actorId: string,
  ipAddress: string | null,
): Promise<UserInvitationDto> {
  const school = await prisma.school.findUnique({
    where: { id: input.schoolId },
    select: { id: true, name: true, status: true },
  });

  if (!school) {
    throw new NotFoundError('School not found.');
  }

  if (school.status !== 'ACTIVE') {
    throw new BadRequestError('Cannot invite an administrator to an inactive or suspended school.');
  }

  const normalizedEmail = input.email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError('A user with this email address already exists.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const placeholderHash = `!INVITED_PENDING_ACTIVATION_${crypto.randomBytes(16).toString('hex')}`;
    const user = await tx.user.create({
      data: {
        schoolId: school.id,
        email: normalizedEmail,
        role: 'SCHOOL_ADMIN',
        status: 'INACTIVE',
        passwordHash: placeholderHash,
      },
    });

    const invitationResult = await createInvitation({
      tx,
      schoolId: school.id,
      userId: user.id,
      email: normalizedEmail,
      role: 'SCHOOL_ADMIN',
      recipientName: `${input.firstName} ${input.lastName}`.trim(),
      invitedByUserId: actorId,
    });

    await recordAuditEvent({
      schoolId: school.id,
      actorId,
      action: AUDIT_ACTIONS.TENANT_ADMIN_INVITED,
      entityType: 'User',
      entityId: user.id,
      delta: {
        email: normalizedEmail,
        schoolName: school.name,
        role: 'SCHOOL_ADMIN',
        invitationId: invitationResult.invitation.id,
      },
      ipAddress,
    });

    return invitationResult;
  });

  const dispatchResult = await dispatchInvitationEmail({
    invitationId: result.invitation.id,
    rawToken: result.rawToken,
    invitationUrl: result.invitationUrl,
    recipientEmail: result.invitation.email,
    recipientName: `${input.firstName} ${input.lastName}`.trim(),
    role: 'SCHOOL_ADMIN',
    schoolId: school.id,
    schoolName: school.name,
    expiresAt: new Date(result.invitation.expiresAt),
    type: 'INVITATION_INITIAL',
  });

  return {
    ...result.invitation,
    deliveryStatus: dispatchResult.delivered ? 'SENT' : 'FAILED',
    deliveryError: dispatchResult.error ?? null,
  };
}

export async function updatePlatformUserStatus(
  userId: string,
  newStatus: UserStatus,
  actorId: string,
  ipAddress: string | null,
): Promise<{ id: string; email: string; status: UserStatus }> {
  if (userId === actorId) {
    throw new BadRequestError('Administrators cannot suspend or deactivate their own account.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, status: true, role: true, schoolId: true },
  });

  if (!existingUser) {
    throw new NotFoundError('User was not found.');
  }

  if (existingUser.status === newStatus) {
    return { id: existingUser.id, email: existingUser.email, status: existingUser.status };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: userId },
      data: { status: newStatus },
      select: { id: true, email: true, status: true },
    });

    if (newStatus === 'INACTIVE' || newStatus === 'LOCKED') {
      await tx.session.deleteMany({
        where: { userId },
      });
    }

    await recordAuditEvent({
      schoolId: existingUser.schoolId,
      actorId,
      action: AUDIT_ACTIONS.AUTH_ACCOUNT_STATUS_CHANGED,
      entityType: 'User',
      entityId: userId,
      delta: {
        email: existingUser.email,
        role: existingUser.role,
        previousStatus: existingUser.status,
        newStatus,
      },
      ipAddress,
    });

    return u;
  });

  return updated;
}
