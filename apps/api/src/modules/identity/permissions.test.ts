import { describe, it, expect, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { requirePermission, requireRole } from '../../middleware/authorize.js';
import { requireCsrfHeader } from '../../middleware/csrf.js';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors/appError.js';
import { PERMISSIONS, getPermissionsForRole, hasPermission } from './permissions.js';

vi.mock('../audit/audit.service.js', () => ({
  AUDIT_ACTIONS: { AUTH_AUTHORIZATION_DENIED: 'AUTH_AUTHORIZATION_DENIED' },
  recordAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('RBAC permission catalogue', () => {
  it('grants platform permissions to SUPER_ADMIN without unrestricted student access', () => {
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.PLATFORM_SCHOOLS_CREATE)).toBe(true);
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.ATTENDANCE_CREATE)).toBe(false);
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.ASSIGNMENTS_GRADE)).toBe(false);
  });

  it('grants school-scoped admin permissions to SCHOOL_ADMIN without platform permissions', () => {
    expect(hasPermission('SCHOOL_ADMIN', PERMISSIONS.SCHOOL_USERS_CREATE)).toBe(true);
    expect(hasPermission('SCHOOL_ADMIN', PERMISSIONS.PLATFORM_SCHOOLS_CREATE)).toBe(false);
  });

  it('grants teaching and support-review permissions to TEACHER', () => {
    expect(hasPermission('TEACHER', PERMISSIONS.ATTENDANCE_CREATE)).toBe(true);
    expect(hasPermission('TEACHER', PERMISSIONS.SUPPORT_FLAGS_REVIEW)).toBe(true);
    expect(hasPermission('TEACHER', PERMISSIONS.SCHOOL_USERS_CREATE)).toBe(false);
  });

  it('grants self-service permissions to STUDENT', () => {
    expect(hasPermission('STUDENT', PERMISSIONS.STUDENT_ASSIGNMENTS_SUBMIT_SELF)).toBe(true);
    expect(hasPermission('STUDENT', PERMISSIONS.ASSIGNMENTS_GRADE)).toBe(false);
  });

  it('grants read-only linked-child permissions to PARENT', () => {
    expect(hasPermission('PARENT', PERMISSIONS.PARENT_CHILDREN_READ_LINKED)).toBe(true);
    expect(hasPermission('PARENT', PERMISSIONS.ASSIGNMENTS_CREATE)).toBe(false);
    expect(hasPermission('PARENT', PERMISSIONS.ATTENDANCE_CREATE)).toBe(false);
  });
});

describe('Authorization middlewares (deny by default)', () => {
  it('rejects unauthenticated requests with UnauthorizedError', async () => {
    const req = { method: 'GET', originalUrl: '/test' } as Request;
    const next = vi.fn() as unknown as NextFunction;
    await requirePermission(PERMISSIONS.SCHOOL_USERS_READ)(req, {} as Response, next);
    expect((next as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejects missing permission with ForbiddenError', async () => {
    const req = {
      method: 'POST',
      originalUrl: '/test',
      auth: {
        sessionId: 's1',
        userId: 'u1',
        schoolId: 'sch1',
        role: 'STUDENT',
        email: 's@test.edu',
        permissions: getPermissionsForRole('STUDENT'),
      },
    } as unknown as Request;
    const next = vi.fn() as unknown as NextFunction;
    await requirePermission(PERMISSIONS.ASSIGNMENTS_GRADE)(req, {} as Response, next);
    expect((next as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('allows matching role and permission', async () => {
    const req = {
      method: 'GET',
      originalUrl: '/test',
      auth: {
        sessionId: 's1',
        userId: 'u1',
        schoolId: 'sch1',
        role: 'TEACHER',
        email: 't@test.edu',
        permissions: getPermissionsForRole('TEACHER'),
      },
    } as unknown as Request;
    const next = vi.fn() as unknown as NextFunction;
    await requireRole(['TEACHER'])(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('CSRF middleware', () => {
  it('allows safe GET requests without custom headers', () => {
    const req = { method: 'GET', headers: {}, is: () => false } as unknown as Request;
    const next = vi.fn() as unknown as NextFunction;
    requireCsrfHeader(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks state-changing requests missing X-Requested-With and JSON content type', () => {
    const req = {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      is: () => false,
    } as unknown as Request;
    const next = vi.fn() as unknown as NextFunction;
    requireCsrfHeader(req, {} as Response, next);
    expect((next as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('allows state-changing requests with X-Requested-With header', () => {
    const req = {
      method: 'DELETE',
      headers: { 'x-requested-with': 'XMLHttpRequest' },
      is: () => false,
    } as unknown as Request;
    const next = vi.fn() as unknown as NextFunction;
    requireCsrfHeader(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});
