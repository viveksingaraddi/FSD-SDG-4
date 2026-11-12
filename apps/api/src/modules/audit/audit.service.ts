import type { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/index.js';
import { logger } from '../../shared/logging/logger.js';

export const AUDIT_ACTIONS = {
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_PASSWORD_CHANGED: 'AUTH_PASSWORD_CHANGED',
  AUTH_PASSWORD_RESET_REQUESTED: 'AUTH_PASSWORD_RESET_REQUESTED',
  AUTH_PASSWORD_RESET_COMPLETED: 'AUTH_PASSWORD_RESET_COMPLETED',
  AUTH_SESSION_REVOKED: 'AUTH_SESSION_REVOKED',
  AUTH_ACCOUNT_DEACTIVATED: 'AUTH_ACCOUNT_DEACTIVATED',
  AUTH_ROLE_CHANGED: 'AUTH_ROLE_CHANGED',
  AUTH_SCHOOL_MEMBERSHIP_CHANGED: 'AUTH_SCHOOL_MEMBERSHIP_CHANGED',
  AUTH_AUTHORIZATION_DENIED: 'AUTH_AUTHORIZATION_DENIED',
  GUARDIAN_RELATIONSHIP_VERIFIED: 'GUARDIAN_RELATIONSHIP_VERIFIED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const NIL_AUDIT_ENTITY_ID = '00000000-0000-0000-0000-000000000000';

const FORBIDDEN_AUDIT_KEYS = new Set([
  'password',
  'passwordhash',
  'currentpassword',
  'newpassword',
  'token',
  'tokenhash',
  'resettoken',
  'secret',
  'cookie',
  'sid',
  'authorization',
]);

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_AUDIT_KEYS.has(k.toLowerCase())) {
        clean[k] = '[REDACTED]';
      } else {
        clean[k] = sanitizeValue(v);
      }
    }
    return clean;
  }
  return value;
}

export interface RecordAuditEventInput {
  schoolId?: string | null;
  actorId?: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId?: string;
  delta?: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  try {
    const sanitizedDelta =
      input.delta !== undefined ? (sanitizeValue(input.delta) as Prisma.InputJsonValue) : undefined;

    await prisma.auditLog.create({
      data: {
        schoolId: input.schoolId ?? null,
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? NIL_AUDIT_ENTITY_ID,
        ...(sanitizedDelta !== undefined ? { delta: sanitizedDelta } : {}),
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (err) {
    logger.error({ err, action: input.action }, 'Failed to persist audit log event');
  }
}
