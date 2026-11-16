import crypto from 'node:crypto';
import type { DeliveryStatus, Prisma, UserRole } from '@prisma/client';
import type { InvitationVerificationDto, UserInvitationDto } from '@fsd-sdg4/contracts';
import type { InvitationFilterQuery } from '@fsd-sdg4/validation';
import { prisma } from '../../shared/db/prisma.js';
import { BadRequestError, NotFoundError } from '../../shared/errors/appError.js';
import { hashPassword } from '../../shared/security/password.js';
import { AUDIT_ACTIONS, recordAuditEvent } from '../audit/audit.service.js';
import { dispatchInvitationEmail } from '../mail/mail.service.js';

export const DEFAULT_INVITATION_EXPIRATION_HOURS = 168; // 7 days

export function generateInvitationToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

export function buildInvitationUrl(rawToken: string): string {
  const baseUrl =
    process.env['APP_BASE_URL'] || process.env['FRONTEND_URL'] || 'http://localhost:5173';
  return `${baseUrl}/accept-invitation?token=${rawToken}`;
}

export interface CreateInvitationParams {
  tx?: Prisma.TransactionClient | undefined;
  schoolId?: string | null | undefined;
  userId: string;
  email: string;
  role: UserRole;
  recipientName?: string | null | undefined;
  invitedByUserId?: string | null | undefined;
  expirationHours?: number | undefined;
  sendEmail?: boolean | undefined;
}

export interface CreatedInvitationResult {
  invitation: UserInvitationDto;
  rawToken: string;
  invitationUrl: string;
}

export async function createInvitation(
  params: CreateInvitationParams,
): Promise<CreatedInvitationResult> {
  const client = params.tx ?? prisma;
  const { rawToken, tokenHash } = generateInvitationToken();
  const expiresAt = new Date(
    Date.now() + (params.expirationHours ?? DEFAULT_INVITATION_EXPIRATION_HOURS) * 3600 * 1000,
  );

  const created = await client.userInvitation.create({
    data: {
      schoolId: params.schoolId ?? null,
      userId: params.userId,
      email: params.email.toLowerCase().trim(),
      role: params.role,
      tokenHash,
      status: 'PENDING',
      deliveryStatus: 'PENDING',
      deliveryAttempts: 0,
      expiresAt,
      invitedByUserId: params.invitedByUserId ?? null,
    },
    include: {
      school: {
        select: { name: true },
      },
    },
  });

  const invitationUrl = buildInvitationUrl(rawToken);

  let currentDeliveryStatus: DeliveryStatus = created.deliveryStatus;
  let currentDeliveryError: string | null = created.deliveryError;

  if (!params.tx && params.sendEmail !== false) {
    const dispatchResult = await dispatchInvitationEmail({
      invitationId: created.id,
      rawToken,
      invitationUrl,
      recipientEmail: created.email,
      recipientName: params.recipientName,
      role: created.role,
      schoolId: created.schoolId,
      schoolName: created.school?.name,
      expiresAt: created.expiresAt,
      type: 'INVITATION_INITIAL',
    });
    currentDeliveryStatus = dispatchResult.delivered ? 'SENT' : 'FAILED';
    currentDeliveryError = dispatchResult.error ?? null;
  }

  return {
    invitation: {
      id: created.id,
      schoolId: created.schoolId,
      schoolName: created.school?.name ?? null,
      userId: created.userId,
      email: created.email,
      role: created.role,
      status: created.status,
      deliveryStatus: currentDeliveryStatus,
      deliveryAttempts: created.deliveryAttempts,
      deliveredAt: created.deliveredAt?.toISOString() ?? null,
      deliveryError: currentDeliveryError,
      expiresAt: created.expiresAt.toISOString(),
      acceptedAt: created.acceptedAt?.toISOString() ?? null,
      revokedAt: created.revokedAt?.toISOString() ?? null,
      createdAt: created.createdAt.toISOString(),
      invitationUrl,
    },
    rawToken,
    invitationUrl,
  };
}

export async function verifyInvitation(rawToken: string): Promise<InvitationVerificationDto> {
  if (!rawToken || typeof rawToken !== 'string') {
    return { valid: false, reason: 'INVALID' };
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

  const invitation = await prisma.userInvitation.findUnique({
    where: { tokenHash },
    include: {
      school: { select: { name: true, status: true } },
    },
  });

  if (!invitation) {
    return { valid: false, reason: 'NOT_FOUND' };
  }

  if (invitation.schoolId && invitation.school && invitation.school.status !== 'ACTIVE') {
    return { valid: false, reason: 'INVALID' };
  }

  if (invitation.status === 'ACCEPTED') {
    return { valid: false, reason: 'ACCEPTED' };
  }

  if (invitation.status === 'REVOKED') {
    return { valid: false, reason: 'REVOKED' };
  }

  const now = new Date();
  if (now > invitation.expiresAt || invitation.status === 'EXPIRED') {
    if (invitation.status === 'PENDING') {
      await prisma.userInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
    }
    return { valid: false, reason: 'EXPIRED' };
  }

  return {
    valid: true,
    email: invitation.email,
    role: invitation.role,
    schoolName: invitation.school?.name ?? null,
  };
}

export interface AcceptInvitationParams {
  rawToken: string;
  password: string;
  ipAddress: string | null;
}

export async function acceptInvitation(
  params: AcceptInvitationParams,
): Promise<{ success: boolean; email: string; role: UserRole; schoolName?: string | null }> {
  const tokenHash = crypto.createHash('sha256').update(params.rawToken.trim()).digest('hex');

  const invitation = await prisma.userInvitation.findUnique({
    where: { tokenHash },
    include: {
      school: { select: { id: true, name: true, status: true } },
    },
  });

  if (!invitation) {
    throw new NotFoundError('Invitation was not found or is invalid.');
  }

  if (invitation.schoolId && invitation.school && invitation.school.status !== 'ACTIVE') {
    throw new BadRequestError(
      'The associated educational institution is inactive or suspended. Please contact platform support.',
    );
  }

  if (invitation.status === 'ACCEPTED') {
    throw new BadRequestError('This invitation has already been accepted.');
  }

  if (invitation.status === 'REVOKED') {
    throw new BadRequestError(
      'This invitation has been revoked. Please contact your administrator.',
    );
  }

  const now = new Date();
  if (now > invitation.expiresAt || invitation.status === 'EXPIRED') {
    if (invitation.status === 'PENDING') {
      await prisma.userInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
    }
    throw new BadRequestError('This invitation has expired. Please contact your administrator.');
  }

  const passwordHash = await hashPassword(params.password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: invitation.userId },
      data: {
        passwordHash,
        status: 'ACTIVE',
      },
    });

    await tx.userInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: now,
      },
    });

    await recordAuditEvent({
      schoolId: invitation.schoolId,
      actorId: invitation.userId,
      action: AUDIT_ACTIONS.AUTH_INVITATION_ACCEPTED,
      entityType: 'UserInvitation',
      entityId: invitation.id,
      delta: {
        email: invitation.email,
        role: invitation.role,
      },
      ipAddress: params.ipAddress,
    });
  });

  return {
    success: true,
    email: invitation.email,
    role: invitation.role,
    schoolName: invitation.school?.name ?? null,
  };
}

export async function resendInvitation(params: {
  invitationId: string;
  schoolId?: string | null;
  actorId: string;
  ipAddress: string | null;
}): Promise<UserInvitationDto> {
  const existing = await prisma.userInvitation.findUnique({
    where: { id: params.invitationId },
    include: { school: { select: { name: true } } },
  });

  if (!existing) {
    throw new NotFoundError('Invitation was not found.');
  }

  if (params.schoolId !== undefined && existing.schoolId !== params.schoolId) {
    throw new NotFoundError('Invitation was not found.');
  }

  if (existing.status === 'ACCEPTED') {
    throw new BadRequestError('Cannot resend an invitation that has already been accepted.');
  }

  const alreadyAccepted = await prisma.userInvitation.findFirst({
    where: {
      email: existing.email,
      role: existing.role,
      schoolId: existing.schoolId,
      status: 'ACCEPTED',
    },
  });
  if (alreadyAccepted) {
    throw new BadRequestError(
      'Cannot resend an invitation for an account that has already been accepted and activated.',
    );
  }

  const { rawToken, tokenHash } = generateInvitationToken();
  const expiresAt = new Date(Date.now() + DEFAULT_INVITATION_EXPIRATION_HOURS * 3600 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    // Revoke previous
    await tx.userInvitation.update({
      where: { id: existing.id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    // Create fresh
    const fresh = await tx.userInvitation.create({
      data: {
        schoolId: existing.schoolId,
        userId: existing.userId,
        email: existing.email,
        role: existing.role,
        tokenHash,
        status: 'PENDING',
        expiresAt,
        invitedByUserId: params.actorId,
      },
      include: {
        school: { select: { name: true } },
      },
    });

    await recordAuditEvent({
      schoolId: existing.schoolId,
      actorId: params.actorId,
      action: AUDIT_ACTIONS.USER_INVITATION_RESENT,
      entityType: 'UserInvitation',
      entityId: fresh.id,
      delta: {
        previousInvitationId: existing.id,
        email: existing.email,
        role: existing.role,
      },
      ipAddress: params.ipAddress,
    });

    return fresh;
  });

  const invitationUrl = buildInvitationUrl(rawToken);

  const dispatchResult = await dispatchInvitationEmail({
    invitationId: result.id,
    rawToken,
    invitationUrl,
    recipientEmail: result.email,
    role: result.role,
    schoolId: result.schoolId,
    schoolName: result.school?.name,
    expiresAt: result.expiresAt,
    type: 'INVITATION_RESEND',
  });

  return {
    id: result.id,
    schoolId: result.schoolId,
    schoolName: result.school?.name ?? null,
    userId: result.userId,
    email: result.email,
    role: result.role,
    status: result.status,
    deliveryStatus: dispatchResult.delivered ? 'SENT' : 'FAILED',
    deliveryAttempts: 1,
    deliveredAt: dispatchResult.delivered ? new Date().toISOString() : null,
    deliveryError: dispatchResult.error ?? null,
    expiresAt: result.expiresAt.toISOString(),
    acceptedAt: result.acceptedAt?.toISOString() ?? null,
    revokedAt: result.revokedAt?.toISOString() ?? null,
    createdAt: result.createdAt.toISOString(),
    invitationUrl,
  };
}

export async function revokeInvitation(params: {
  invitationId: string;
  schoolId?: string | null;
  actorId: string;
  ipAddress: string | null;
}): Promise<UserInvitationDto> {
  const existing = await prisma.userInvitation.findUnique({
    where: { id: params.invitationId },
    include: { school: { select: { name: true } } },
  });

  if (!existing) {
    throw new NotFoundError('Invitation was not found.');
  }

  if (params.schoolId !== undefined && existing.schoolId !== params.schoolId) {
    throw new NotFoundError('Invitation was not found.');
  }

  if (existing.status === 'ACCEPTED') {
    throw new BadRequestError('Cannot revoke an invitation that has already been accepted.');
  }

  const alreadyAccepted = await prisma.userInvitation.findFirst({
    where: {
      email: existing.email,
      role: existing.role,
      schoolId: existing.schoolId,
      status: 'ACCEPTED',
    },
  });
  if (alreadyAccepted) {
    throw new BadRequestError(
      'Cannot revoke an invitation for an account that has already been accepted and activated.',
    );
  }

  const updated = await prisma.userInvitation.update({
    where: { id: existing.id },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
    },
    include: {
      school: { select: { name: true } },
    },
  });

  await recordAuditEvent({
    schoolId: existing.schoolId,
    actorId: params.actorId,
    action: AUDIT_ACTIONS.USER_INVITATION_REVOKED,
    entityType: 'UserInvitation',
    entityId: updated.id,
    delta: {
      email: updated.email,
      role: updated.role,
    },
    ipAddress: params.ipAddress,
  });

  return {
    id: updated.id,
    schoolId: updated.schoolId,
    schoolName: updated.school?.name ?? null,
    userId: updated.userId,
    email: updated.email,
    role: updated.role,
    status: updated.status,
    deliveryStatus: updated.deliveryStatus,
    deliveryAttempts: updated.deliveryAttempts,
    deliveredAt: updated.deliveredAt?.toISOString() ?? null,
    deliveryError: updated.deliveryError ?? null,
    expiresAt: updated.expiresAt.toISOString(),
    acceptedAt: updated.acceptedAt?.toISOString() ?? null,
    revokedAt: updated.revokedAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function listInvitations(params: {
  schoolId?: string | null;
  query: InvitationFilterQuery;
}): Promise<UserInvitationDto[]> {
  const now = new Date();
  const where: Prisma.UserInvitationWhereInput = {
    ...(params.schoolId !== undefined ? { schoolId: params.schoolId } : {}),
  };

  const rawInvitations = await prisma.userInvitation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      school: { select: { name: true } },
    },
  });

  // State precedence: ACCEPTED (4) > PENDING (3) > EXPIRED (2) > REVOKED (1)
  const STATE_RANK: Record<string, number> = {
    ACCEPTED: 4,
    PENDING: 3,
    EXPIRED: 2,
    REVOKED: 1,
  };

  type InvWithEffective = (typeof rawInvitations)[0] & {
    effectiveStatus: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  };

  const recipientMap = new Map<string, InvWithEffective>();

  for (const inv of rawInvitations) {
    let effectiveStatus: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED' = inv.status;
    if (inv.status === 'PENDING' && now > inv.expiresAt) {
      effectiveStatus = 'EXPIRED';
    }

    const key = `${(inv.schoolId ?? 'platform').toLowerCase()}:${inv.email.trim().toLowerCase()}:${inv.role}`;
    const current = recipientMap.get(key);

    if (!current) {
      recipientMap.set(key, { ...inv, effectiveStatus });
      continue;
    }

    const currentRank = STATE_RANK[current.effectiveStatus] ?? 0;
    const invRank = STATE_RANK[effectiveStatus] ?? 0;

    if (invRank > currentRank) {
      recipientMap.set(key, { ...inv, effectiveStatus });
    } else if (invRank === currentRank) {
      // Pick the most recent record
      if (inv.createdAt.getTime() > current.createdAt.getTime()) {
        recipientMap.set(key, { ...inv, effectiveStatus });
      }
    }
  }

  // Convert deduplicated records to DTOs
  let result: UserInvitationDto[] = Array.from(recipientMap.values()).map((inv) => ({
    id: inv.id,
    schoolId: inv.schoolId,
    schoolName: inv.school?.name ?? null,
    userId: inv.userId,
    email: inv.email,
    role: inv.role,
    status: inv.effectiveStatus,
    deliveryStatus: inv.deliveryStatus,
    deliveryAttempts: inv.deliveryAttempts,
    deliveredAt: inv.deliveredAt?.toISOString() ?? null,
    deliveryError: inv.deliveryError ?? null,
    expiresAt: inv.expiresAt.toISOString(),
    acceptedAt: inv.acceptedAt?.toISOString() ?? null,
    revokedAt: inv.revokedAt?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
  }));

  // Apply filters on deduplicated authoritative records
  if (params.query.role && params.query.role !== 'ALL') {
    result = result.filter((inv) => inv.role === params.query.role);
  }

  if (params.query.status && params.query.status !== 'ALL') {
    result = result.filter((inv) => inv.status === params.query.status);
  }

  if (params.query.deliveryStatus && params.query.deliveryStatus !== 'ALL') {
    result = result.filter((inv) => inv.deliveryStatus === params.query.deliveryStatus);
  }

  if (params.query.search) {
    const searchLower = params.query.search.trim().toLowerCase();
    result = result.filter((inv) => inv.email.toLowerCase().includes(searchLower));
  }

  // Sort by createdAt descending
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return result;
}
