import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors/appError.js';
import { getPermissionsForRole } from '../identity/permissions.js';

vi.mock('../../middleware/authenticate.js', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction): void => {
    const roleHeader = req.get('x-test-role');
    if (!roleHeader) {
      next(new UnauthorizedError('Authentication required.'));
      return;
    }
    const role = roleHeader as 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
    const overrideSchoolId = req.get('x-test-school-id');
    const overrideUserId = req.get('x-test-user-id');
    req.auth = {
      userId: overrideUserId ?? '11111111-1111-4111-8111-111111111111',
      sessionId: '22222222-2222-4222-8222-222222222222',
      role,
      schoolId:
        overrideSchoolId !== undefined
          ? overrideSchoolId === 'null'
            ? null
            : overrideSchoolId
          : '10000000-0000-4000-8000-000000000001',
      permissions: getPermissionsForRole(role),
    };
    next();
  },
}));

vi.mock('../audit/audit.service.js', () => ({
  AUDIT_ACTIONS: {
    BULK_IMPORT_COMPLETED: 'BULK_IMPORT_COMPLETED',
    USER_INVITED: 'USER_INVITED',
  },
  recordAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../mail/mail.service.js', () => ({
  dispatchInvitationEmail: vi
    .fn()
    .mockResolvedValue({ delivered: true, messageId: '<test-msg-1>' }),
  isMailConfigured: vi.fn().mockReturnValue(true),
  verifyMailConnection: vi.fn().mockResolvedValue({ ok: true }),
}));

import { createApp } from '../../app.js';
import { prisma } from '../../shared/db/prisma.js';

vi.mock('../../shared/db/prisma.js', () => ({
  prisma: {
    class: {
      findMany: vi.fn(),
    },
    academicYear: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    teacherProfile: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    studentProfile: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    guardianRelationship: {
      create: vi.fn(),
    },
    enrollment: {
      create: vi.fn(),
    },
    userInvitation: {
      create: vi.fn(),
      update: vi.fn(),
    },
    bulkImportJob: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('Bulk Onboarding & Import API Endpoints', () => {
  const app = createApp({ enableRateLimit: false });
  const testSchoolId = '10000000-0000-4000-8000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/school/bulk-import/template', () => {
    it('downloads CSV template for STUDENTS when authorized as School Admin', async () => {
      const res = await request(app)
        .get('/api/v1/school/bulk-import/template?category=STUDENTS&format=csv')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-test-school-id', testSchoolId);

      if (res.status !== 200) {
        console.log('JOB ERRORS FAILURE:', res.status, JSON.stringify(res.body));
      }
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('edvarq-students-import-template.csv');
      expect(res.text).toContain('First Name');
      expect(res.text).toContain('Student ID Number');
    });

    it('downloads XLSX template for TEACHERS', async () => {
      const res = await request(app)
        .get('/api/v1/school/bulk-import/template?category=TEACHERS&format=xlsx')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-test-school-id', testSchoolId);

      if (res.status !== 200) {
        console.log('JOB ERRORS FAILURE:', res.status, JSON.stringify(res.body));
      }
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.headers['content-disposition']).toContain('edvarq-teachers-import-template.xlsx');
    });

    it('rejects access from TEACHER role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/school/bulk-import/template?category=STUDENTS')
        .set('x-test-role', 'TEACHER');

      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/school/bulk-import/template?category=STUDENTS');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/school/bulk-import/preview', () => {
    it('previews and validates a valid student CSV file without modifying database', async () => {
      vi.mocked(prisma.class.findMany).mockResolvedValue([
        {
          id: 'class-1',
          schoolId: testSchoolId,
          name: 'Grade 10',
          gradeLevel: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          sections: [
            {
              id: 'sec-1',
              classId: 'class-1',
              schoolId: testSchoolId,
              academicYearId: 'ay-1',
              name: 'Section A',
              capacity: 30,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ] as any);

      vi.mocked(prisma.academicYear.findFirst).mockResolvedValue({
        id: 'ay-1',
        schoolId: testSchoolId,
        name: '2026-2027',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.studentProfile.findMany).mockResolvedValue([]);

      const csvContent =
        'First Name,Last Name,Student ID Number,Student Email,Class Name,Section Name\n' +
        'Dev,Sharma,STU-101,dev.sharma@example.com,Grade 10,Section A\n';

      const res = await request(app)
        .post('/api/v1/school/bulk-import/preview')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-test-school-id', testSchoolId)
        .field('category', 'STUDENTS')
        .attach('file', Buffer.from(csvContent, 'utf8'), 'students.csv');

      if (res.status !== 200) {
        console.log('JOB ERRORS FAILURE:', res.status, JSON.stringify(res.body));
      }
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRows).toBe(1);
      expect(res.body.data.validRows).toBe(1);
      expect(res.body.data.invalidRows).toBe(0);
      expect(res.body.data.canProceed).toBe(true);
      expect(res.body.data.detectedRows[0].isValid).toBe(true);
    });

    it('successfully previews the exact 10-row student demo CSV with ISO dates and zero invalid records', async () => {
      vi.mocked(prisma.class.findMany).mockResolvedValue([
        {
          id: 'class-8',
          schoolId: testSchoolId,
          name: 'Grade 8',
          gradeLevel: 8,
          sections: [
            { id: 'sec-8a', name: '8-A', classId: 'class-8', schoolId: testSchoolId },
            { id: 'sec-8b', name: '8-B', classId: 'class-8', schoolId: testSchoolId },
          ],
        },
        {
          id: 'class-9',
          schoolId: testSchoolId,
          name: 'Grade 9',
          gradeLevel: 9,
          sections: [
            { id: 'sec-9a', name: 'A', classId: 'class-9', schoolId: testSchoolId },
            { id: 'sec-9b', name: 'B', classId: 'class-9', schoolId: testSchoolId },
          ],
        },
        {
          id: 'class-10',
          schoolId: testSchoolId,
          name: 'Grade 10',
          gradeLevel: 10,
          sections: [
            { id: 'sec-10a', name: 'A', classId: 'class-10', schoolId: testSchoolId },
            { id: 'sec-10b', name: 'B', classId: 'class-10', schoolId: testSchoolId },
          ],
        },
      ] as any);

      vi.mocked(prisma.academicYear.findMany).mockResolvedValue([
        {
          id: 'ay-2026',
          schoolId: testSchoolId,
          name: '2026-2027',
          status: 'ACTIVE',
        } as any,
      ]);
      vi.mocked(prisma.academicYear.findFirst).mockResolvedValue({
        id: 'ay-2026',
        schoolId: testSchoolId,
        name: '2026-2027',
        status: 'ACTIVE',
      } as any);

      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.studentProfile.findMany).mockResolvedValue([]);

      const demoCsv = [
        'First Name,Last Name,Student ID Number,Student Email,Class Name,Section Name,Academic Year Name,Admission Date,Date of Birth,Gender,Parent Email,Parent Name,Parent Relationship',
        'Aarav,Patel,STU-2026-001,aarav.patel@student.example.com,Grade 10,Section A,2026-2027,2026-06-01,2010-04-15,MALE,rajesh.patel@example.com,Rajesh Patel,FATHER',
        'Diya,Sharma,STU-2026-002,diya.sharma@student.example.com,Grade 10,Section A,2026-2027,2026-06-03,2010-09-22,FEMALE,meera.sharma@example.com,Meera Sharma,MOTHER',
        'Kabir,Mehta,STU-2026-003,kabir.mehta@student.example.com,Grade 9,Section B,2026-2027,2026-06-05,2011-01-08,MALE,amit.mehta@example.com,Amit Mehta,FATHER',
        'Ananya,Rao,STU-2026-004,ananya.rao@student.example.com,Grade 8,Section A,2026-2027,2026-06-08,2012-03-17,FEMALE,sudha.rao@example.com,Sudha Rao,MOTHER',
        'Ishaan,Khan,STU-2026-005,ishaan.khan@student.example.com,Grade 9,Section B,2026-2027,2026-06-10,2011-11-30,MALE,farah.khan@example.com,Farah Khan,MOTHER',
        'Myra,Nair,STU-2026-006,myra.nair@student.example.com,Grade 8,Section B,2026-2027,2026-06-12,2012-07-04,FEMALE,anil.nair@example.com,Anil Nair,FATHER',
        'Vihaan,Desai,STU-2026-007,vihaan.desai@student.example.com,Grade 10,Section B,2026-2027,2026-06-15,2010-12-12,MALE,kavita.desai@example.com,Kavita Desai,MOTHER',
        'Sara,Iyer,STU-2026-008,sara.iyer@student.example.com,Grade 8,Section A,2026-2027,2026-06-18,2012-10-25,FEMALE,priya.iyer@example.com,Priya Iyer,MOTHER',
        'Arjun,Reddy,STU-2026-009,arjun.reddy@student.example.com,Grade 9,Section A,2026-2027,2026-06-20,2011-05-19,MALE,suresh.reddy@example.com,Suresh Reddy,FATHER',
        'Aadhya,Joshi,STU-2026-010,aadhya.joshi@student.example.com,Grade 10,Section A,2026-2027,2026-06-22,2010-08-03,FEMALE,neha.joshi@example.com,Neha Joshi,MOTHER',
      ].join('\n');

      const res = await request(app)
        .post('/api/v1/school/bulk-import/preview')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-test-school-id', testSchoolId)
        .field('category', 'STUDENTS')
        .attach('file', Buffer.from(demoCsv, 'utf8'), 'edvarq_students_bulk_import_demo.csv');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRows).toBe(10);
      expect(res.body.data.validRows).toBe(10);
      expect(res.body.data.invalidRows).toBe(0);
      expect(res.body.data.duplicateRows).toBe(0);
      expect(res.body.data.canProceed).toBe(true);
      expect(res.body.data.detectedRows).toHaveLength(10);
      expect(res.body.data.detectedRows.every((r: any) => r.isValid)).toBe(true);
    });

    it('identifies invalid class, section and duplicate email errors during preview', async () => {
      vi.mocked(prisma.class.findMany).mockResolvedValue([]);
      vi.mocked(prisma.academicYear.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'user-existing', email: 'taken@example.com', role: 'STUDENT' } as any,
      ]);
      vi.mocked(prisma.studentProfile.findMany).mockResolvedValue([]);

      const csvContent =
        'First Name,Last Name,Student ID Number,Student Email,Class Name,Section Name\n' +
        'Dev,Sharma,STU-101,taken@example.com,NonExistentClass,Section Z\n';

      const res = await request(app)
        .post('/api/v1/school/bulk-import/preview')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-test-school-id', testSchoolId)
        .field('category', 'STUDENTS')
        .attach('file', Buffer.from(csvContent, 'utf8'), 'students.csv');

      if (res.status !== 200) {
        console.log('JOB ERRORS FAILURE:', res.status, JSON.stringify(res.body));
      }
      expect(res.status).toBe(200);
      expect(res.body.data.validRows).toBe(0);
      expect(res.body.data.invalidRows).toBe(1);
      expect(res.body.data.canProceed).toBe(false);
      expect(res.body.data.detectedRows[0].isValid).toBe(false);
      expect(res.body.data.detectedRows[0].errors.length).toBeGreaterThan(0);
    });

    it('rejects unsupported file extension (.exe) with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/school/bulk-import/preview')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-test-school-id', testSchoolId)
        .field('category', 'STUDENTS')
        .attach('file', Buffer.from('binary-code', 'utf8'), 'malicious.exe');

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/school/bulk-import/execute', () => {
    it('requires CSRF header (x-requested-with) on execute mutation', async () => {
      const res = await request(app)
        .post('/api/v1/school/bulk-import/execute')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-test-school-id', testSchoolId)
        .field('category', 'TEACHERS')
        .attach('file', Buffer.from('data', 'utf8'), 'teachers.csv');

      expect(res.status).toBe(403);
    });

    it('executes teacher import and dispatches automatic email invitations', async () => {
      vi.mocked(prisma.bulkImportJob.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.bulkImportJob.create).mockResolvedValue({
        id: 'job-1',
        schoolId: testSchoolId,
        actorId: '11111111-1111-4111-8111-111111111111',
        category: 'TEACHERS',
        filename: 'teachers.csv',
        fileSize: 100,
        status: 'PROCESSING',
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        duplicateRows: 0,
        successfulRows: 0,
        failedRows: 0,
        skippedRows: 0,
        invitationsCreated: 0,
        invitationsSent: 0,
        invitationsFailed: 0,
        summary: null,
        errors: null,
        results: null,
        idempotencyKey: null,
        startedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.teacherProfile.findMany).mockResolvedValue([]);
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        id: testSchoolId,
        name: 'Greenfield Academy',
      } as any);

      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'new-teacher-user',
        email: 'priya.nair@school.example.com',
        role: 'TEACHER',
        status: 'ACTIVE',
      } as any);

      vi.mocked(prisma.teacherProfile.create).mockResolvedValue({
        id: 'profile-1',
        employeeId: 'EMP-999',
      } as any);

      vi.mocked(prisma.userInvitation.create).mockResolvedValue({
        id: 'inv-1',
        schoolId: testSchoolId,
        userId: 'new-teacher-user',
        email: 'priya.nair@school.example.com',
        role: 'TEACHER',
        tokenHash: 'hash',
        status: 'PENDING',
        deliveryStatus: 'PENDING',
        deliveryAttempts: 0,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      } as any);

      vi.mocked(prisma.userInvitation.update).mockResolvedValue({} as any);

      vi.mocked(prisma.bulkImportJob.update).mockResolvedValue({
        id: 'job-1',
        schoolId: testSchoolId,
        actorId: '11111111-1111-4111-8111-111111111111',
        category: 'TEACHERS',
        filename: 'teachers.csv',
        fileSize: 100,
        status: 'COMPLETED',
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        duplicateRows: 0,
        successfulRows: 1,
        failedRows: 0,
        skippedRows: 0,
        invitationsCreated: 1,
        invitationsSent: 1,
        invitationsFailed: 0,
        summary: null,
        errors: null,
        results: null,
        idempotencyKey: null,
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        actor: { email: 'admin@school.com' },
      } as any);

      const csvContent =
        'First Name,Last Name,Email Address,Employee ID,Specialization\n' +
        'Priya,Nair,priya.nair@school.example.com,EMP-999,Chemistry\n';

      const res = await request(app)
        .post('/api/v1/school/bulk-import/execute')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-test-school-id', testSchoolId)
        .set('x-requested-with', 'XMLHttpRequest')
        .field('category', 'TEACHERS')
        .attach('file', Buffer.from(csvContent, 'utf8'), 'teachers.csv');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.successfulRows).toBe(1);
      expect(res.body.data.invitationsSent).toBe(1);
    });
  });

  describe('GET /api/v1/school/bulk-import/jobs & Error Reports', () => {
    it('lists bulk import jobs scoped to authenticated school tenant', async () => {
      vi.mocked(prisma.bulkImportJob.count).mockResolvedValue(1);
      vi.mocked(prisma.bulkImportJob.findMany).mockResolvedValue([
        {
          id: 'job-1',
          schoolId: testSchoolId,
          actorId: 'user-1',
          category: 'STUDENTS',
          filename: 'students.csv',
          fileSize: 2048,
          status: 'COMPLETED',
          totalRows: 10,
          validRows: 10,
          invalidRows: 0,
          duplicateRows: 0,
          successfulRows: 10,
          failedRows: 0,
          skippedRows: 0,
          invitationsCreated: 10,
          invitationsSent: 10,
          invitationsFailed: 0,
          summary: null,
          errors: null,
          idempotencyKey: null,
          startedAt: new Date(),
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          actor: { email: 'admin@school.com' },
        } as any,
      ]);

      const res = await request(app)
        .get('/api/v1/school/bulk-import/jobs?page=1&limit=10')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-test-school-id', testSchoolId);

      if (res.status !== 200) {
        console.log('JOB ERRORS FAILURE:', res.status, JSON.stringify(res.body));
      }
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].id).toBe('job-1');
      expect(res.body.data.items[0].category).toBe('STUDENTS');
    });

    it('downloads CSV error report with formula injection sanitization', async () => {
      vi.mocked(prisma.bulkImportJob.findFirst).mockResolvedValue({
        id: '11111111-2222-4333-8444-555555555555',
        schoolId: testSchoolId,
        errors: [
          {
            rowNumber: 2,
            identifier: '=1+1',
            message: 'Invalid Class assignment',
            rawData: { name: 'Aarav' },
          },
        ],
      } as any);

      const res = await request(app)
        .get('/api/v1/school/bulk-import/jobs/11111111-2222-4333-8444-555555555555/errors')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-test-school-id', testSchoolId);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Row Number,Identifier,Error Message,Raw Data');
      // Verify formula prefix was neutralized
      expect(res.text).toContain("'=1+1");
    });
  });
});
