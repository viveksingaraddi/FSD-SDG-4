import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors/appError.js';
import { getPermissionsForRole } from './permissions.js';

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
          : role === 'SUPER_ADMIN'
            ? null
            : '33333333-3333-4333-8333-333333333333',
      permissions: getPermissionsForRole(role),
    };
    next();
  },
}));

vi.mock('../audit/audit.service.js', () => ({
  AUDIT_ACTIONS: {
    TENANT_ADMIN_INVITED: 'TENANT_ADMIN_INVITED',
    AUTH_ACCOUNT_STATUS_CHANGED: 'AUTH_ACCOUNT_STATUS_CHANGED',
    GUARDIAN_RELATIONSHIP_LINKED: 'GUARDIAN_RELATIONSHIP_LINKED',
    GUARDIAN_RELATIONSHIP_UNLINKED: 'GUARDIAN_RELATIONSHIP_UNLINKED',
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
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    teacherProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    studentProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    guardianRelationship: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    userInvitation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    emailOutbox: {
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: typeof prisma) => Promise<unknown>) => cb(prisma)),
  },
}));

describe('User Lifecycle Management APIs (Super Admin & School Admin)', () => {
  const app = createApp({ enableRateLimit: false });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Super Admin: /api/v1/super-admin/users', () => {
    it('lists platform users with pagination and search', async () => {
      vi.mocked(prisma.user.count).mockResolvedValueOnce(1);
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
        {
          id: 'user-admin-1',
          email: 'principal@highschool.edu',
          role: 'SCHOOL_ADMIN',
          status: 'ACTIVE',
          schoolId: 'school-1',
          lastLoginAt: new Date(),
          createdAt: new Date(),
          school: { id: 'school-1', name: 'High School' },
          teacherProfile: null,
          studentProfile: null,
          invitations: [],
        } as never,
      ]);

      const res = await request(app)
        .get('/api/v1/super-admin/users?search=principal&page=1&limit=10')
        .set('x-test-role', 'SUPER_ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].email).toBe('principal@highschool.edu');
      expect(res.body.data.items[0].role).toBe('SCHOOL_ADMIN');
      expect(res.body.data.total).toBe(1);
    });

    it('rejects access from non-super-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/super-admin/users')
        .set('x-test-role', 'SCHOOL_ADMIN');

      expect(res.status).toBe(403);
    });

    it('invites a new School Administrator for an active school and dispatches email', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValueOnce({
        id: '99999999-9999-4999-8999-999999999999',
        name: 'Evergreen Academy',
        status: 'ACTIVE',
      } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'new-admin-1',
        email: 'headmaster@evergreen.edu',
        role: 'SCHOOL_ADMIN',
        status: 'INACTIVE',
      } as never);
      vi.mocked(prisma.userInvitation.create).mockResolvedValueOnce({
        id: 'inv-1',
        email: 'headmaster@evergreen.edu',
        role: 'SCHOOL_ADMIN',
        schoolId: '99999999-9999-4999-8999-999999999999',
        status: 'PENDING',
        deliveryStatus: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        createdAt: new Date(),
        school: { name: 'Evergreen Academy' },
      } as never);

      const res = await request(app)
        .post('/api/v1/super-admin/users/invite')
        .set('x-test-role', 'SUPER_ADMIN')
        .set('x-csrf-token', 'valid-csrf')
        .send({
          schoolId: '99999999-9999-4999-8999-999999999999',
          email: 'headmaster@evergreen.edu',
          firstName: 'Robert',
          lastName: 'Fischer',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('headmaster@evergreen.edu');
      expect(res.body.data.role).toBe('SCHOOL_ADMIN');
    });

    it('rejects inviting administrator to a suspended school', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValueOnce({
        id: '99999999-9999-4999-8999-999999999999',
        name: 'Evergreen Academy',
        status: 'SUSPENDED',
      } as never);

      const res = await request(app)
        .post('/api/v1/super-admin/users/invite')
        .set('x-test-role', 'SUPER_ADMIN')
        .set('x-csrf-token', 'valid-csrf')
        .send({
          schoolId: '99999999-9999-4999-8999-999999999999',
          email: 'headmaster@evergreen.edu',
          firstName: 'Robert',
          lastName: 'Fischer',
        });

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('inactive or suspended');
    });

    it('updates user status (suspend) and invalidates active sessions', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: '55555555-5555-4555-8555-555555555555',
        email: 'target@school.edu',
        status: 'ACTIVE',
        role: 'SCHOOL_ADMIN',
        schoolId: 'school-1',
      } as never);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: '55555555-5555-4555-8555-555555555555',
        email: 'target@school.edu',
        status: 'INACTIVE',
      } as never);

      const res = await request(app)
        .patch('/api/v1/super-admin/users/55555555-5555-4555-8555-555555555555/status')
        .set('x-test-role', 'SUPER_ADMIN')
        .set('x-csrf-token', 'valid-csrf')
        .send({ status: 'INACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('INACTIVE');
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: '55555555-5555-4555-8555-555555555555' },
      });
    });

    it('prevents self-lockout (administrator cannot suspend themselves)', async () => {
      const res = await request(app)
        .patch('/api/v1/super-admin/users/11111111-1111-4111-8111-111111111111/status')
        .set('x-test-role', 'SUPER_ADMIN')
        .set('x-test-user-id', '11111111-1111-4111-8111-111111111111')
        .set('x-csrf-token', 'valid-csrf')
        .send({ status: 'INACTIVE' });

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain('cannot suspend or deactivate their own account');
    });
  });

  describe('School Admin: /api/v1/school/users & Guardian Linking', () => {
    it('lists school users strictly scoped to the tenant', async () => {
      vi.mocked(prisma.user.count).mockResolvedValueOnce(2);
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
        {
          id: 'user-teacher-1',
          email: 'math.teacher@oakridge.edu',
          role: 'TEACHER',
          status: 'ACTIVE',
          schoolId: '33333333-3333-4333-8333-333333333333',
          lastLoginAt: new Date(),
          createdAt: new Date(),
          teacherProfile: { firstName: 'Alice', lastName: 'Wong', employeeId: 'EMP-01' },
          studentProfile: null,
          invitations: [],
        } as never,
        {
          id: 'user-student-1',
          email: 'alex.smith@oakridge.edu',
          role: 'STUDENT',
          status: 'ACTIVE',
          schoolId: '33333333-3333-4333-8333-333333333333',
          lastLoginAt: null,
          createdAt: new Date(),
          teacherProfile: null,
          studentProfile: { firstName: 'Alex', lastName: 'Smith', studentIdNumber: 'STU-01' },
          invitations: [],
        } as never,
      ]);
      vi.mocked(prisma.school.findUnique).mockResolvedValueOnce({
        name: 'Oakridge High School',
      } as never);

      const res = await request(app).get('/api/v1/school/users').set('x-test-role', 'SCHOOL_ADMIN');

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.items[0].displayName).toBe('Alice Wong');
      expect(res.body.data.items[1].displayName).toBe('Alex Smith');
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: '33333333-3333-4333-8333-333333333333' }),
        }),
      );
    });

    it('rejects access from teachers to school users management', async () => {
      const res = await request(app).get('/api/v1/school/users').set('x-test-role', 'TEACHER');

      expect(res.status).toBe(403);
    });

    it('updates user status within school tenant', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
        id: '22222222-2222-4222-8222-222222222222',
        email: 'teacher@oakridge.edu',
        status: 'ACTIVE',
        role: 'TEACHER',
      } as never);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: '22222222-2222-4222-8222-222222222222',
        email: 'teacher@oakridge.edu',
        status: 'LOCKED',
      } as never);

      const res = await request(app)
        .patch('/api/v1/school/users/22222222-2222-4222-8222-222222222222/status')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-csrf-token', 'valid-csrf')
        .send({ status: 'LOCKED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('LOCKED');
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: '22222222-2222-4222-8222-222222222222' },
      });
    });

    it('links parent/guardian to student with relationship type and primary contact flag', async () => {
      vi.mocked(prisma.studentProfile.findFirst).mockResolvedValueOnce({
        id: '33333333-3333-4333-8333-333333333333',
        firstName: 'Alex',
        lastName: 'Smith',
      } as never);
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
        id: '44444444-4444-4444-8444-444444444444',
        email: 'mary.smith@parents.com',
        role: 'PARENT',
      } as never);
      vi.mocked(prisma.guardianRelationship.upsert).mockResolvedValueOnce({
        id: 'rel-1',
        schoolId: '33333333-3333-4333-8333-333333333333',
        studentId: '33333333-3333-4333-8333-333333333333',
        guardianUserId: '44444444-4444-4444-8444-444444444444',
        relationshipType: 'MOTHER',
        isPrimaryContact: true,
        isVerified: true,
      } as never);

      const res = await request(app)
        .post('/api/v1/school/students/33333333-3333-4333-8333-333333333333/guardians')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-csrf-token', 'valid-csrf')
        .send({
          guardianUserId: '44444444-4444-4444-8444-444444444444',
          relationshipType: 'MOTHER',
          isPrimaryContact: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.relationshipType).toBe('MOTHER');
    });

    it('unlinks parent/guardian from student', async () => {
      vi.mocked(prisma.guardianRelationship.findUnique).mockResolvedValueOnce({
        id: 'rel-1',
        schoolId: '33333333-3333-4333-8333-333333333333',
        studentId: '33333333-3333-4333-8333-333333333333',
        guardianUserId: '44444444-4444-4444-8444-444444444444',
      } as never);

      const res = await request(app)
        .delete(
          '/api/v1/school/students/33333333-3333-4333-8333-333333333333/guardians/44444444-4444-4444-8444-444444444444',
        )
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-requested-with', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(prisma.guardianRelationship.delete).toHaveBeenCalledWith({
        where: { id: 'rel-1' },
      });
    });

    it('enforces tenant boundary by rejecting user operations on other school tenants', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

      const res = await request(app)
        .patch('/api/v1/school/users/55555555-5555-4555-8555-555555555555/status')
        .set('x-test-role', 'SCHOOL_ADMIN')
        .set('x-csrf-token', 'valid-csrf')
        .send({ status: 'INACTIVE' });

      expect(res.status).toBe(404);
      expect(res.body.detail).toContain('not found in this school');
    });
  });
});
