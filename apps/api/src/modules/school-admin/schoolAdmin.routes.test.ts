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
    const overrideSchoolId = req.get('x-test-school-id');
    req.auth = {
      userId: '11111111-1111-4111-8111-111111111111',
      sessionId: '22222222-2222-4222-8222-222222222222',
      role,
      schoolId:
        overrideSchoolId !== undefined
          ? overrideSchoolId === 'null'
            ? null
            : overrideSchoolId
          : role === 'SUPER_ADMIN'
            ? null
            : '33333333-3333-4333-8333-333333333333',
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

  it('rejects STUDENT and PARENT roles from accessing school admin overview with 403', async () => {
    const studentRes = await request(app)
      .get(API_ROUTES.SCHOOL.OVERVIEW)
      .set('x-test-role', 'STUDENT');
    expect(studentRes.status).toBe(403);

    const parentRes = await request(app)
      .get(API_ROUTES.SCHOOL.OVERVIEW)
      .set('x-test-role', 'PARENT');
    expect(parentRes.status).toBe(403);
  });

  it('rejects school admin request if tenant context is missing from session', async () => {
    const res = await request(app)
      .get(API_ROUTES.SCHOOL.OVERVIEW)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('x-test-school-id', 'null');

    expect(res.status).toBe(403);
  });

  it('scopes overview query strictly to authenticated session schoolId', async () => {
    const spy = vi.spyOn(schoolAdminService, 'getSchoolOverview').mockResolvedValue({
      schoolName: 'Synthetic High',
      activeAcademicYear: '2026-2027',
      totalStudents: 120,
      totalStaff: 18,
      totalClasses: 6,
      totalSections: 12,
      activeSupportPlans: 3,
      attendance: {
        recordedDate: '2026-10-14',
        totalRecorded: 120,
        present: 110,
        absent: 6,
        late: 2,
        excused: 2,
        attendanceRate: 93,
        trend: [],
      },
      academic: {
        activeAssignments: 5,
        upcomingAssessments: 2,
        totalAssessments: 8,
        recentAssessments: [],
      },
      activity: {
        recentStudents: [],
        recentAuditLogs: [],
      },
      alerts: [],
    });

    const res = await request(app)
      .get(API_ROUTES.SCHOOL.OVERVIEW)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('x-test-school-id', 'school-tenant-xyz');

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith('school-tenant-xyz');
    expect(res.body.data.schoolName).toBe('Synthetic High');
    expect(res.body.data.attendance.attendanceRate).toBe(93);
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
