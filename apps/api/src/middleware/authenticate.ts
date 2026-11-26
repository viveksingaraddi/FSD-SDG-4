import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@fsd-sdg4/contracts';
import { env } from '../config/env.js';
import { prisma } from '../shared/database/index.js';
import { UnauthorizedError } from '../shared/errors/appError.js';
import { hashOpaqueToken } from '../shared/security/password.js';
import { getPermissionsForRole, type Permission } from '../modules/identity/permissions.js';

export const SESSION_COOKIE_NAME = env.NODE_ENV === 'production' ? '__Host-sid' : 'sid';
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface AuthContext {
  sessionId: string;
  userId: string;
  schoolId: string | null;
  role: UserRole;
  email: string;
  permissions: readonly Permission[];
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function buildSessionCookieOptions(expiresAt?: Date) {
  const isSecure = env.NODE_ENV === 'production' || env.NODE_ENV === 'staging';
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    path: '/',
    ...(expiresAt !== undefined ? { expires: expiresAt } : {}),
  };
}

/**
 * Validates the server-side session cookie against PostgreSQL, enforcing:
 * - Session existence and non-expiration
 * - Active user account status and non-deleted state
 * - Active school status for school-scoped users
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawToken = (req.cookies as Record<string, string | undefined> | undefined)?.[
      SESSION_COOKIE_NAME
    ];

    if (typeof rawToken !== 'string' || rawToken.length < 16) {
      next(new UnauthorizedError('Authentication required.'));
      return;
    }

    const tokenHash = hashOpaqueToken(rawToken);
    const session = await prisma.orm.public.Session.include('user', (user) =>
      user.include('school', (school) => school.select('id', 'status')),
    )
      .where({ tokenHash })
      .first();

    if (session === null) {
      next(new UnauthorizedError('Session is invalid or expired.'));
      return;
    }

    const user = session.user;
    if (user === null) {
      next(new UnauthorizedError('Session is invalid or expired.'));
      return;
    }

    const now = new Date();
    const isExpired = session.expiresAt <= now;
    const isUserInactive = user.status !== 'ACTIVE' || user.deletedAt !== null;
    const isSchoolInvalid =
      user.role !== 'SUPER_ADMIN' && (user.schoolId === null || user.school?.status !== 'ACTIVE');

    if (isExpired || isUserInactive || isSchoolInvalid) {
      await prisma.orm.public.Session.where({ id: session.id })
        .delete()
        .catch(() => undefined);
      next(new UnauthorizedError('Session is invalid or expired.'));
      return;
    }

    req.auth = {
      sessionId: session.id,
      userId: user.id,
      schoolId: user.schoolId,
      role: user.role,
      email: user.email,
      permissions: getPermissionsForRole(user.role),
    };

    next();
  } catch (err) {
    next(err);
  }
}
