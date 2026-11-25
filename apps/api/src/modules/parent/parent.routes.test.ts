import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors/appError.js';
import { getPermissionsForRole } from '../identity/permissions.js';
import * as tenantAuth from '../identity/tenantAuthorization.js';

vi.mock('../../middleware/authenticate.js', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction): void => {
    const roleHeader = req.get('x-test-role');
    if (!roleHeader) {
      next(new UnauthorizedError('Authentication required.'));
      return;
    }
    const role = roleHeader as 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
    req.auth = {
      userId: '11111111-1111-4111-8111-111111111111',
      sessionId: '22222222-2222-4222-8222-222222222222',
      role,
      email: 'parent@example.invalid',
      schoolId: role === 'SUPER_ADMIN' ? null : '33333333-3333-4333-8333-333333333333',
      permissions: getPermissionsForRole(role),
    };
    next();
  },
}));

vi.mock('../audit/audit.service.js', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    recordAuditEvent: vi.fn().mockResolvedValue(undefined),
  };
});

import { createApp } from '../../app.js';

const app = createApp({ enableRateLimit: false });
const VALID_STUDENT_ID = '44444444-4444-4444-8444-444444444444';

describe('Parent Portal API routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get(API_ROUTES.PARENT.OVERVIEW);
    expect(res.status).toBe(401);
  });

  it('rejects STUDENT role from accessing parent overview with 403', async () => {
    const res = await request(app).get(API_ROUTES.PARENT.OVERVIEW).set('x-test-role', 'STUDENT');
    expect(res.status).toBe(403);
  });

  it('rejects unverified guardian access to child attendance with 403', async () => {
    vi.spyOn(tenantAuth, 'assertVerifiedGuardian').mockRejectedValueOnce(
      new ForbiddenError('Access requires a verified guardian-student relationship.'),
    );

    const url = API_ROUTES.PARENT.CHILD_ATTENDANCE.replace(':studentId', VALID_STUDENT_ID);
    const res = await request(app).get(url).set('x-test-role', 'PARENT');
    expect(res.status).toBe(403);
  });
});
