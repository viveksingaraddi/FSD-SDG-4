import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/appError.js';
import { AUDIT_ACTIONS, recordAuditEvent } from '../modules/audit/audit.service.js';
import type { Permission } from '../modules/identity/permissions.js';

export function requireRole(allowedRoles: readonly UserRole[]): RequestHandler {
  const roleSet = new Set<UserRole>(allowedRoles);

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.auth === undefined) {
      next(new UnauthorizedError('Authentication required.'));
      return;
    }

    if (!roleSet.has(req.auth.role)) {
      await recordAuditEvent({
        schoolId: req.auth.schoolId,
        actorId: req.auth.userId,
        action: AUDIT_ACTIONS.AUTH_AUTHORIZATION_DENIED,
        entityType: 'Route',
        delta: {
          reason: 'role_denied',
          method: req.method,
          path: req.originalUrl,
          role: req.auth.role,
        },
        ipAddress: req.ip ?? null,
      });
      next(new ForbiddenError('You do not have the required role for this resource.'));
      return;
    }

    next();
  };
}

export function requirePermission(...requiredPermissions: Permission[]): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.auth === undefined) {
      next(new UnauthorizedError('Authentication required.'));
      return;
    }

    const granted = new Set<Permission>(req.auth.permissions);
    const hasAll = requiredPermissions.every((perm) => granted.has(perm));

    if (!hasAll) {
      await recordAuditEvent({
        schoolId: req.auth.schoolId,
        actorId: req.auth.userId,
        action: AUDIT_ACTIONS.AUTH_AUTHORIZATION_DENIED,
        entityType: 'Route',
        delta: {
          reason: 'permission_denied',
          method: req.method,
          path: req.originalUrl,
          requiredPermissions,
        },
        ipAddress: req.ip ?? null,
      });
      next(new ForbiddenError('You do not have permission to perform this action.'));
      return;
    }

    next();
  };
}
