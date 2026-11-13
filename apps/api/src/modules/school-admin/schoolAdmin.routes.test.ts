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

  it('lists staff scoped to authenticated school tenant with search & status filters', async () => {
    const spy = vi.spyOn(schoolAdminService, 'listStaff').mockResolvedValue([
      {
        id: '11111111-2222-4333-8444-555555555555',
        userId: '22222222-3333-4444-8555-666666666666',
        employeeId: 'EMP-001',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@school.edu',
        specialization: 'Mathematics',
        status: 'ACTIVE',
        allocationCount: 2,
      },
    ]);

    const res = await request(app)
      .get(API_ROUTES.SCHOOL.STAFF)
      .query({ search: 'Jane', status: 'ACTIVE' })
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('x-test-school-id', 'tenant-school-1');

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith('tenant-school-1', { search: 'Jane', status: 'ACTIVE' });
    expect(res.body.data[0].employeeId).toBe('EMP-001');
    expect(res.body.data[0].allocationCount).toBe(2);
  });

  it('retrieves detailed teacher profile with course allocations and audit history', async () => {
    const teacherId = '11111111-2222-4333-8444-555555555555';
    const spy = vi.spyOn(schoolAdminService, 'getStaffById').mockResolvedValue({
      id: teacherId,
      userId: '22222222-3333-4444-8555-666666666666',
      employeeId: 'EMP-001',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@school.edu',
      specialization: 'Mathematics',
      status: 'ACTIVE',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:00:00.000Z',
      allocations: [
        {
          id: '33333333-4444-4555-8666-777777777777',
          courseOfferingId: '44444444-5555-4666-8777-888888888888',
          subjectId: '55555555-6666-4777-8888-999999999999',
          subjectName: 'Mathematics',
          subjectCode: 'MATH-8',
          sectionId: '66666666-7777-4888-8999-000000000000',
          sectionName: '8A',
          classId: '77777777-8888-4999-8000-111111111111',
          className: 'Grade 8',
          academicYearId: '88888888-9999-4000-8111-222222222222',
          academicYearName: '2026-2027',
          role: 'PRIMARY',
          assignedAt: '2026-09-05T09:00:00.000Z',
        },
      ],
      recentAuditLogs: [],
    });

    const res = await request(app)
      .get(`${API_ROUTES.SCHOOL.STAFF}/${teacherId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('x-test-school-id', 'tenant-school-1');

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith('tenant-school-1', teacherId);
    expect(res.body.data.employeeId).toBe('EMP-001');
    expect(res.body.data.allocations[0].subjectName).toBe('Mathematics');
  });

  it('creates teacher profile with duplicate checks and audit logging', async () => {
    const spy = vi.spyOn(schoolAdminService, 'createStaff').mockResolvedValue({
      id: '11111111-2222-4333-8444-555555555555',
      userId: '22222222-3333-4444-8555-666666666666',
      employeeId: 'EMP-002',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@school.edu',
      specialization: 'Physics',
      status: 'ACTIVE',
      allocationCount: 0,
    });

    const res = await request(app)
      .post(API_ROUTES.SCHOOL.STAFF)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1')
      .send({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@school.edu',
        employeeId: 'EMP-002',
        specialization: 'Physics',
        temporaryPassword: 'TempPassword@2026!',
      });

    expect(res.status).toBe(201);
    expect(spy).toHaveBeenCalled();
    expect(res.body.data.email).toBe('john.smith@school.edu');
  });

  it('updates teacher profile details via PATCH /staff/:id', async () => {
    const teacherId = '11111111-2222-4333-8444-555555555555';
    const spy = vi.spyOn(schoolAdminService, 'updateStaff').mockResolvedValue({
      id: teacherId,
      userId: '22222222-3333-4444-8555-666666666666',
      employeeId: 'EMP-001',
      firstName: 'Jane',
      lastName: 'Updated',
      email: 'jane.doe@school.edu',
      specialization: 'Advanced Mathematics',
      status: 'ACTIVE',
    });

    const res = await request(app)
      .patch(`${API_ROUTES.SCHOOL.STAFF}/${teacherId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1')
      .send({
        lastName: 'Updated',
        specialization: 'Advanced Mathematics',
      });

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(
      'tenant-school-1',
      teacherId,
      { lastName: 'Updated', specialization: 'Advanced Mathematics' },
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );
  });

  it('allocates teacher to course offering via POST /staff/:id/allocations', async () => {
    const teacherId = '11111111-2222-4333-8444-555555555555';
    const spy = vi.spyOn(schoolAdminService, 'allocateTeacher').mockResolvedValue({
      id: '33333333-4444-4555-8666-777777777777',
      courseOfferingId: '44444444-5555-4666-8777-888888888888',
      subjectId: '55555555-6666-4777-8888-999999999999',
      subjectName: 'Science',
      subjectCode: 'SCI-8',
      sectionId: '66666666-7777-4888-8999-000000000000',
      sectionName: '8B',
      classId: '77777777-8888-4999-8000-111111111111',
      className: 'Grade 8',
      academicYearId: '88888888-9999-4000-8111-222222222222',
      academicYearName: '2026-2027',
      role: 'PRIMARY',
      assignedAt: '2026-09-10T10:00:00.000Z',
    });

    const res = await request(app)
      .post(`${API_ROUTES.SCHOOL.STAFF}/${teacherId}/allocations`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1')
      .send({
        academicYearId: '88888888-9999-4000-8111-222222222222',
        subjectId: '55555555-6666-4777-8888-999999999999',
        sectionId: '66666666-7777-4888-8999-000000000000',
        role: 'PRIMARY',
      });

    expect(res.status).toBe(201);
    expect(spy).toHaveBeenCalled();
    expect(res.body.data.subjectName).toBe('Science');
  });

  it('deallocates teacher from course offering via DELETE /staff/:id/allocations/:allocationId', async () => {
    const teacherId = '11111111-2222-4333-8444-555555555555';
    const allocationId = '33333333-4444-4555-8666-777777777777';
    const spy = vi
      .spyOn(schoolAdminService, 'deallocateTeacher')
      .mockResolvedValue({ success: true });

    const res = await request(app)
      .delete(`${API_ROUTES.SCHOOL.STAFF}/${teacherId}/allocations/${allocationId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1');

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(
      'tenant-school-1',
      teacherId,
      allocationId,
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );
  });

  it('soft-deletes staff member via DELETE /staff/:id', async () => {
    const teacherId = '11111111-2222-4333-8444-555555555555';
    const spy = vi.spyOn(schoolAdminService, 'deleteStaff').mockResolvedValue({ success: true });

    const res = await request(app)
      .delete(`${API_ROUTES.SCHOOL.STAFF}/${teacherId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1');

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(
      'tenant-school-1',
      teacherId,
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );
  });

  it('updates academic year via PATCH /academic-years/:id with tenant isolation', async () => {
    const yearId = '11111111-2222-4333-8444-555555555555';
    const spy = vi.spyOn(schoolAdminService, 'updateAcademicYear').mockResolvedValue({
      id: yearId,
      name: '2026-2027 Revised',
      startDate: '2026-06-01',
      endDate: '2027-04-30',
      status: 'ACTIVE',
      sectionCount: 5,
    });

    const res = await request(app)
      .patch(`${API_ROUTES.SCHOOL.ACADEMIC_YEARS}/${yearId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1')
      .send({
        name: '2026-2027 Revised',
        startDate: '2026-06-01',
        endDate: '2027-04-30',
        status: 'ACTIVE',
      });

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(
      'tenant-school-1',
      yearId,
      expect.objectContaining({ name: '2026-2027 Revised', status: 'ACTIVE' }),
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );
    expect(res.body.data.name).toBe('2026-2027 Revised');
  });

  it('updates class via PATCH /classes/:id and deletes via DELETE /classes/:id', async () => {
    const classId = '11111111-2222-4333-8444-555555555555';
    const updateSpy = vi.spyOn(schoolAdminService, 'updateClass').mockResolvedValue({
      id: classId,
      name: 'Grade 8 Updated',
      stage: 'Middle School',
      sortOrder: 8,
      sections: [],
      studentCount: 0,
    });
    const deleteSpy = vi
      .spyOn(schoolAdminService, 'deleteClass')
      .mockResolvedValue({ success: true });

    const patchRes = await request(app)
      .patch(`${API_ROUTES.SCHOOL.CLASSES}/${classId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1')
      .send({ name: 'Grade 8 Updated', stage: 'Middle School' });

    expect(patchRes.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      'tenant-school-1',
      classId,
      expect.objectContaining({ name: 'Grade 8 Updated' }),
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );

    const deleteRes = await request(app)
      .delete(`${API_ROUTES.SCHOOL.CLASSES}/${classId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1');

    expect(deleteRes.status).toBe(200);
    expect(deleteSpy).toHaveBeenCalledWith(
      'tenant-school-1',
      classId,
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );
  });

  it('updates section via PATCH /sections/:id and deletes via DELETE /sections/:id', async () => {
    const sectionId = '11111111-2222-4333-8444-555555555555';
    const updateSpy = vi.spyOn(schoolAdminService, 'updateSection').mockResolvedValue({
      id: sectionId,
      name: '8-B',
      capacity: 35,
      roomNumber: 'Room 202',
      academicYearId: '11111111-1111-4111-8111-111111111111',
      academicYearName: '2026-2027',
      studentCount: 15,
    });
    const deleteSpy = vi
      .spyOn(schoolAdminService, 'deleteSection')
      .mockResolvedValue({ success: true });

    const patchRes = await request(app)
      .patch(`${API_ROUTES.SCHOOL.SECTIONS}/${sectionId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1')
      .send({ name: '8-B', capacity: 35 });

    expect(patchRes.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      'tenant-school-1',
      sectionId,
      expect.objectContaining({ name: '8-B', capacity: 35 }),
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );

    const deleteRes = await request(app)
      .delete(`${API_ROUTES.SCHOOL.SECTIONS}/${sectionId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1');

    expect(deleteRes.status).toBe(200);
    expect(deleteSpy).toHaveBeenCalledWith(
      'tenant-school-1',
      sectionId,
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );
  });

  it('updates subject via PATCH /subjects/:id and deletes via DELETE /subjects/:id', async () => {
    const subjectId = '11111111-2222-4333-8444-555555555555';
    const updateSpy = vi.spyOn(schoolAdminService, 'updateSubject').mockResolvedValue({
      id: subjectId,
      name: 'Advanced Science',
      code: 'SCI-ADV',
      description: 'Advanced curriculum',
      credits: '4.00',
      offeringCount: 0,
    });
    const deleteSpy = vi
      .spyOn(schoolAdminService, 'deleteSubject')
      .mockResolvedValue({ success: true });

    const patchRes = await request(app)
      .patch(`${API_ROUTES.SCHOOL.SUBJECTS}/${subjectId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1')
      .send({ name: 'Advanced Science', code: 'SCI-ADV' });

    expect(patchRes.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      'tenant-school-1',
      subjectId,
      expect.objectContaining({ name: 'Advanced Science' }),
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );

    const deleteRes = await request(app)
      .delete(`${API_ROUTES.SCHOOL.SUBJECTS}/${subjectId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1');

    expect(deleteRes.status).toBe(200);
    expect(deleteSpy).toHaveBeenCalledWith(
      'tenant-school-1',
      subjectId,
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );
  });

  it('manages course offerings and teacher allocations via /offerings', async () => {
    const offeringId = '11111111-2222-4333-8444-555555555555';
    const teacherId = '22222222-3333-4444-8555-666666666666';
    const listSpy = vi.spyOn(schoolAdminService, 'listCourseOfferings').mockResolvedValue([
      {
        id: offeringId,
        academicYearId: '11111111-1111-4111-8111-111111111111',
        academicYearName: '2026-2027',
        classId: '33333333-4444-4555-8666-777777777777',
        className: 'Grade 8',
        sectionId: '44444444-5555-4666-8777-888888888888',
        sectionName: '8-A',
        subjectId: '55555555-6666-4777-8888-999999999999',
        subjectName: 'Mathematics',
        subjectCode: 'MATH-8',
        syllabus: null,
        teachers: [],
      },
    ]);

    const getRes = await request(app)
      .get(API_ROUTES.SCHOOL.OFFERINGS)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('x-test-school-id', 'tenant-school-1');

    expect(getRes.status).toBe(200);
    expect(listSpy).toHaveBeenCalledWith('tenant-school-1', expect.anything());
    expect(getRes.body.data).toHaveLength(1);

    const createSpy = vi.spyOn(schoolAdminService, 'createCourseOffering').mockResolvedValue({
      id: offeringId,
      academicYearId: '11111111-1111-4111-8111-111111111111',
      academicYearName: '2026-2027',
      classId: '33333333-4444-4555-8666-777777777777',
      className: 'Grade 8',
      sectionId: '44444444-5555-4666-8777-888888888888',
      sectionName: '8-A',
      subjectId: '55555555-6666-4777-8888-999999999999',
      subjectName: 'Mathematics',
      subjectCode: 'MATH-8',
      syllabus: null,
      teachers: [],
    });

    const createRes = await request(app)
      .post(API_ROUTES.SCHOOL.OFFERINGS)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1')
      .send({
        academicYearId: '11111111-1111-4111-8111-111111111111',
        sectionId: '44444444-5555-4666-8777-888888888888',
        subjectId: '55555555-6666-4777-8888-999999999999',
      });

    expect(createRes.status).toBe(201);
    expect(createSpy).toHaveBeenCalledWith(
      'tenant-school-1',
      expect.objectContaining({ subjectId: '55555555-6666-4777-8888-999999999999' }),
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );

    const assignSpy = vi.spyOn(schoolAdminService, 'assignOfferingTeacher').mockResolvedValue({
      allocationId: 'alloc-1',
      teacherId,
      teacherName: 'Ananya Verma',
      employeeId: 'TCH-001',
      role: 'PRIMARY',
    });

    const assignRes = await request(app)
      .post(`${API_ROUTES.SCHOOL.OFFERINGS}/${offeringId}/teachers`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1')
      .send({ teacherId, role: 'PRIMARY' });

    expect(assignRes.status).toBe(201);
    expect(assignSpy).toHaveBeenCalledWith(
      'tenant-school-1',
      offeringId,
      { teacherId, role: 'PRIMARY' },
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );

    const removeSpy = vi
      .spyOn(schoolAdminService, 'removeOfferingTeacher')
      .mockResolvedValue({ success: true });

    const removeRes = await request(app)
      .delete(`${API_ROUTES.SCHOOL.OFFERINGS}/${offeringId}/teachers/${teacherId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1');

    expect(removeRes.status).toBe(200);
    expect(removeSpy).toHaveBeenCalledWith(
      'tenant-school-1',
      offeringId,
      teacherId,
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );

    const deleteOfferingSpy = vi
      .spyOn(schoolAdminService, 'deleteCourseOffering')
      .mockResolvedValue({ success: true });

    const deleteRes = await request(app)
      .delete(`${API_ROUTES.SCHOOL.OFFERINGS}/${offeringId}`)
      .set('x-test-role', 'SCHOOL_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('x-test-school-id', 'tenant-school-1');

    expect(deleteRes.status).toBe(200);
    expect(deleteOfferingSpy).toHaveBeenCalledWith(
      'tenant-school-1',
      offeringId,
      '11111111-1111-4111-8111-111111111111',
      expect.anything(),
    );
  });
});
