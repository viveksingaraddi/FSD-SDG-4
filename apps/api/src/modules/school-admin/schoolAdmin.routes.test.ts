import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import { UnauthorizedError } from '../../shared/errors/appError.js';
import { getPermissionsForRole } from '../identity/permissions.js';
import * as schoolAdminService from './schoolAdmin.service.js';

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

describe('School Admin API routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get(API_ROUTES.SCHOOL.OVERVIEW);
    expect(res.status).toBe(401);
  });

  it('rejects TEACHER role from accessing school admin overview with 403', async () => {
    const res = await request(app).get(API_ROUTES.SCHOOL.OVERVIEW).set('x-test-role', 'TEACHER');
    expect(res.status).toBe(403);
  });

  it('scopes overview query to authenticated schoolId', async () => {
    const spy = vi.spyOn(schoolAdminService, 'getSchoolOverview').mockResolvedValue({
      schoolName: 'Synthetic High',
      activeAcademicYear: '2026-2027',
      totalStudents: 120,
      totalStaff: 18,
      totalClasses: 6,
      totalSections: 12,
      activeSupportPlans: 3,
    });

    const res = await request(app)
      .get(API_ROUTES.SCHOOL.OVERVIEW)
      .set('x-test-role', 'SCHOOL_ADMIN');

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith('33333333-3333-4333-8333-333333333333');
    expect(res.body.data.schoolName).toBe('Synthetic High');
  });

  it('validates academic year payload on POST /academic-years', async () => {
    const res = await request(app)
      .post(API_ROUTES.SCHOOL.ACADEMIC_YEARS)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        name: '2026-2027',
        startDate: 'invalid-date',
        endDate: '2027-06-30',
      });

    expect(res.status).toBe(422);
  });
});
