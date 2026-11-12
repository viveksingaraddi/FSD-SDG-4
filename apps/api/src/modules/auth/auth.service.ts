import type { UserRole } from '@prisma/client';
import { prisma } from '../../shared/database/index.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../shared/errors/appError.js';
import {
  generateOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
} from '../../shared/security/password.js';
import { SESSION_TTL_MS } from '../../middleware/authenticate.js';
import { getPermissionsForRole, type Permission } from '../identity/permissions.js';
import { AUDIT_ACTIONS, recordAuditEvent } from '../audit/audit.service.js';

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface SafeAuthUser {
  id: string;
  email: string;
  role: UserRole;
  schoolId: string | null;
  status: string;
  permissions: readonly Permission[];
}

export interface SessionSummary {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

function toSafeUser(user: {
  id: string;
  email: string;
  role: UserRole;
  schoolId: string | null;
  status: string;
}): SafeAuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
    status: user.status,
    permissions: getPermissionsForRole(user.role),
  };
}

export async function login(input: {
  email: string;
  password: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<{ rawToken: string; expiresAt: Date; user: SafeAuthUser }> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      school: {
        select: { id: true, status: true },
      },
    },
  });

  if (user === null) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
      entityType: 'User',
      delta: { reason: 'unknown_account' },
      ipAddress: input.ipAddress,
    });
    throw new UnauthorizedError('Invalid email or password.');
  }

  const passwordValid = await verifyPassword(user.passwordHash, input.password);
  const isUserActive = user.status === 'ACTIVE' && user.deletedAt === null;
  const isSchoolActive =
    user.role === 'SUPER_ADMIN' || (user.schoolId !== null && user.school?.status === 'ACTIVE');

  if (!passwordValid || !isUserActive || !isSchoolActive) {
    await recordAuditEvent({
      schoolId: user.schoolId,
      actorId: user.id,
      action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
      entityType: 'User',
      entityId: user.id,
      delta: {
        reason: !passwordValid ? 'invalid_password' : 'inactive_account_or_school',
      },
      ipAddress: input.ipAddress,
    });
    throw new UnauthorizedError('Invalid email or password.');
  }

  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashOpaqueToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.$transaction([
    prisma.session.create({
      data: {
        userId: user.id,
        schoolId: user.schoolId,
        tokenHash,
        expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
  ]);

  await recordAuditEvent({
    schoolId: user.schoolId,
    actorId: user.id,
    action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
    entityType: 'User',
    entityId: user.id,
    ipAddress: input.ipAddress,
  });

  return {
    rawToken,
    expiresAt,
    user: toSafeUser(user),
  };
}

export async function logout(input: {
  sessionId: string;
  userId: string;
  schoolId: string | null;
  ipAddress: string | null;
}): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      id: input.sessionId,
      userId: input.userId,
    },
  });

  await recordAuditEvent({
    schoolId: input.schoolId,
    actorId: input.userId,
    action: AUDIT_ACTIONS.AUTH_LOGOUT,
    entityType: 'Session',
    entityId: input.sessionId,
    ipAddress: input.ipAddress,
  });
}

export async function getMe(userId: string): Promise<SafeAuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      schoolId: true,
      status: true,
      deletedAt: true,
    },
  });

  if (user === null || user.status !== 'ACTIVE' || user.deletedAt !== null) {
    throw new UnauthorizedError('Authentication required.');
  }

  return toSafeUser(user);
}

export async function forgotPassword(input: {
  email: string;
  ipAddress: string | null;
}): Promise<{ message: string; internalResetToken?: string }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const genericMessage =
    'If an active account matches that email address, password reset instructions have been issued.';

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      schoolId: true,
      status: true,
      deletedAt: true,
    },
  });

  if (user === null || user.status !== 'ACTIVE' || user.deletedAt !== null) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET_REQUESTED,
      entityType: 'User',
      delta: { accountMatched: false },
      ipAddress: input.ipAddress,
    });
    return { message: genericMessage };
  }

  const rawResetToken = generateOpaqueToken(32);
  const tokenHash = hashOpaqueToken(rawResetToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.$transaction([
    // Invalidate any prior unused reset tokens for this user
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  await recordAuditEvent({
    schoolId: user.schoolId,
    actorId: user.id,
    action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET_REQUESTED,
    entityType: 'User',
    entityId: user.id,
    delta: { accountMatched: true },
    ipAddress: input.ipAddress,
  });

  return {
    message: genericMessage,
    internalResetToken: rawResetToken,
  };
}

export async function resetPassword(input: {
  token: string;
  newPassword: string;
  ipAddress: string | null;
}): Promise<void> {
  const tokenHash = hashOpaqueToken(input.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: { id: true, schoolId: true, status: true, deletedAt: true },
      },
    },
  });

  const now = new Date();
  if (
    record === null ||
    record.usedAt !== null ||
    record.expiresAt <= now ||
    record.user.status !== 'ACTIVE' ||
    record.user.deletedAt !== null
  ) {
    throw new BadRequestError('Password reset token is invalid or has expired.');
  }

  const newPasswordHash = await hashPassword(input.newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: newPasswordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    }),
    // Revoke all active sessions after password recovery
    prisma.session.deleteMany({
      where: { userId: record.userId },
    }),
  ]);

  await recordAuditEvent({
    schoolId: record.user.schoolId,
    actorId: record.userId,
    action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET_COMPLETED,
    entityType: 'User',
    entityId: record.userId,
    ipAddress: input.ipAddress,
  });
}

export async function changePassword(input: {
  userId: string;
  currentSessionId: string;
  currentPassword: string;
  newPassword: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<{ rawToken: string; expiresAt: Date }> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      schoolId: true,
      passwordHash: true,
      status: true,
      deletedAt: true,
    },
  });

  if (user === null || user.status !== 'ACTIVE' || user.deletedAt !== null) {
    throw new UnauthorizedError('Authentication required.');
  }

  const currentValid = await verifyPassword(user.passwordHash, input.currentPassword);
  if (!currentValid) {
    throw new UnauthorizedError('Current password is incorrect.');
  }

  if (input.currentPassword === input.newPassword) {
    throw new BadRequestError('New password must differ from current password.');
  }

  const newPasswordHash = await hashPassword(input.newPassword);
  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashOpaqueToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    }),
    // Revoke all prior sessions and rotate to a fresh session for the caller
    prisma.session.deleteMany({
      where: { userId: user.id },
    }),
    prisma.session.create({
      data: {
        userId: user.id,
        schoolId: user.schoolId,
        tokenHash,
        expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    }),
  ]);

  await recordAuditEvent({
    schoolId: user.schoolId,
    actorId: user.id,
    action: AUDIT_ACTIONS.AUTH_PASSWORD_CHANGED,
    entityType: 'User',
    entityId: user.id,
    delta: { sessionRotated: true },
    ipAddress: input.ipAddress,
  });

  return { rawToken, expiresAt };
}

export async function listSessions(
  userId: string,
  currentSessionId: string,
): Promise<SessionSummary[]> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    createdAt: s.createdAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    isCurrent: s.id === currentSessionId,
  }));
}

export async function revokeSession(input: {
  userId: string;
  schoolId: string | null;
  sessionId: string;
  ipAddress: string | null;
}): Promise<void> {
  const deleted = await prisma.session.deleteMany({
    where: {
      id: input.sessionId,
      userId: input.userId,
    },
  });

  if (deleted.count === 0) {
    throw new NotFoundError('Session not found.');
  }

  await recordAuditEvent({
    schoolId: input.schoolId,
    actorId: input.userId,
    action: AUDIT_ACTIONS.AUTH_SESSION_REVOKED,
    entityType: 'Session',
    entityId: input.sessionId,
    ipAddress: input.ipAddress,
  });
}
