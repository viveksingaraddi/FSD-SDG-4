import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { API_ROUTES, type TeacherDashboardDto } from '@fsd-sdg4/contracts';
import { UnauthorizedError } from '../../shared/errors/appError.js';
import { getPermissionsForRole } from '../identity/permissions.js';
import * as teacherService from './teacher.service.js';

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

describe('Teacher API routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get(API_ROUTES.TEACHER.DASHBOARD);
    expect(res.status).toBe(401);
  });

  it('rejects STUDENT and PARENT roles with 403', async () => {
    const studentRes = await request(app)
      .get(API_ROUTES.TEACHER.DASHBOARD)
      .set('x-test-role', 'STUDENT');
    expect(studentRes.status).toBe(403);

    const parentRes = await request(app)
      .get(API_ROUTES.TEACHER.DASHBOARD)
      .set('x-test-role', 'PARENT');
    expect(parentRes.status).toBe(403);
  });

  it('rejects SCHOOL_ADMIN role from teacher dashboard with 403', async () => {
    const adminRes = await request(app)
      .get(API_ROUTES.TEACHER.DASHBOARD)
      .set('x-test-role', 'SCHOOL_ADMIN');
    expect(adminRes.status).toBe(403);
  });

  it('rejects teacher request when tenant context is missing', async () => {
    const res = await request(app)
      .get(API_ROUTES.TEACHER.DASHBOARD)
      .set('x-test-role', 'TEACHER')
      .set('x-test-school-id', 'null');
    expect(res.status).toBe(403);
  });

  it('returns teacher dashboard metrics on GET /api/v1/teacher/dashboard', async () => {
    const mockDashboard = {
      teacher: {
        id: 'tch-1',
        userId: '11111111-1111-4111-8111-111111111111',
        employeeId: 'GF-TCH-001',
        firstName: 'Ananya',
        lastName: 'Verma',
        email: 'teacher1@greenfield.example.invalid',
        specialization: 'Mathematics',
        schoolName: 'Greenfield Primary School',
      },
      stats: {
        assignedClassesCount: 3,
        totalStudentsCount: 84,
        attendanceToday: {
          total: 84,
          present: 78,
          absent: 4,
          late: 2,
          excused: 0,
          attendanceRate: 95,
        },
        pendingAssignmentsCount: 5,
        upcomingExaminationsCount: 2,
      },
      timetableToday: [],
      attendanceOverview: {
        present: 78,
        absent: 4,
        late: 2,
        excused: 0,
        attendanceRate: 95,
        weeklyTrend: [],
      },
      recentActivities: [],
      upcomingTasks: [],
    };

    const spy = vi
      .spyOn(teacherService, 'getTeacherDashboard')
      .mockResolvedValue(mockDashboard as unknown as TeacherDashboardDto);

    const res = await request(app)
      .get(API_ROUTES.TEACHER.DASHBOARD)
      .set('x-test-role', 'TEACHER')
      .set('x-test-school-id', 'school-tenant-xyz');

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', 'school-tenant-xyz');
    expect(res.body.data.teacher.firstName).toBe('Ananya');
    expect(res.body.data.stats.totalStudentsCount).toBe(84);
  });

  it('returns teacher assigned classes on GET /api/v1/teacher/classes', async () => {
    const mockClasses = [
      {
        courseOfferingId: 'offering-1',
        sectionId: 'section-1',
        classId: 'class-1',
        className: 'Grade 8',
        sectionName: '8-A',
        academicYearName: '2026-2027',
        roomNumber: 'Room 201',
        capacity: 35,
        studentCount: 32,
        subjectName: 'Mathematics',
        subjectCode: 'MATH-101',
        isPrimaryTeacher: true,
      },
    ];

    vi.spyOn(teacherService, 'getTeacherClasses').mockResolvedValue(mockClasses);

    const res = await request(app).get(API_ROUTES.TEACHER.CLASSES).set('x-test-role', 'TEACHER');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].className).toBe('Grade 8');
  });

  it('validates attendance submission payload on POST /api/v1/teacher/attendance', async () => {
    const res = await request(app)
      .post(API_ROUTES.TEACHER.ATTENDANCE)
      .set('x-test-role', 'TEACHER')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        sectionId: 'invalid-uuid',
        attendanceDate: 'invalid-date',
        records: [],
      });

    expect(res.status).toBe(422);
  });
});
