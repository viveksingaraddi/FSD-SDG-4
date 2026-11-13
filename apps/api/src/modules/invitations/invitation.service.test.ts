import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  acceptInvitation,
  buildInvitationUrl,
  createInvitation,
  generateInvitationToken,
  resendInvitation,
  revokeInvitation,
  verifyInvitation,
} from './invitation.service.js';
import { prisma } from '../../shared/db/prisma.js';
import { BadRequestError, NotFoundError } from '../../shared/errors/appError.js';

vi.mock('../../shared/db/prisma.js', () => ({
  prisma: {
    userInvitation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) =>
      cb({
        user: { update: vi.fn() },
        userInvitation: {
          update: vi.fn(),
          create: vi.fn(),
        },
        auditLog: { create: vi.fn() },
      }),
    ),
  },
}));

describe('Invitation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInvitationToken', () => {
    it('generates 32-byte hex entropy (64 hex characters) and its SHA-256 hash', () => {
      const { rawToken, tokenHash } = generateInvitationToken();
      expect(rawToken).toHaveLength(64);
      expect(tokenHash).toHaveLength(64);
      expect(rawToken).not.toBe(tokenHash);
    });
  });

  describe('buildInvitationUrl', () => {
    it('constructs accept-invitation route with query token', () => {
      const url = buildInvitationUrl('mock-raw-token-1234');
      expect(url).toContain('/accept-invitation?token=mock-raw-token-1234');
    });
  });

  describe('createInvitation', () => {
    it('creates a UserInvitation record with 7-day expiry and returns invitationUrl without logging raw token', async () => {
      const mockCreated = {
        id: 'inv-123',
        schoolId: 'school-1',
        userId: 'user-1',
        email: 'teacher@school.edu',
        role: 'TEACHER',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 168 * 3600 * 1000),
        acceptedAt: null,
        revokedAt: null,
        createdAt: new Date(),
        school: { name: 'Greenwood High' },
      };

      vi.mocked(prisma.userInvitation.create).mockResolvedValue(mockCreated as never);

      const result = await createInvitation({
        schoolId: 'school-1',
        userId: 'user-1',
        email: 'Teacher@School.edu',
        role: 'TEACHER',
      });

      expect(prisma.userInvitation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: 'school-1',
          userId: 'user-1',
          email: 'teacher@school.edu',
          role: 'TEACHER',
          status: 'PENDING',
        }),
        include: { school: { select: { name: true } } },
      });

      expect(result.invitation.id).toBe('inv-123');
      expect(result.rawToken).toHaveLength(64);
      expect(result.invitationUrl).toContain(result.rawToken);
    });
  });

  describe('verifyInvitation', () => {
    it('returns valid: true with school name and role when invitation is pending and within expiry', async () => {
      vi.mocked(prisma.userInvitation.findUnique).mockResolvedValue({
        id: 'inv-123',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 3600 * 1000),
        email: 'user@example.com',
        role: 'SCHOOL_ADMIN',
        school: { name: 'Oakridge Academy' },
      } as never);

      const res = await verifyInvitation('valid-token-123');
      expect(res.valid).toBe(true);
      expect(res.email).toBe('user@example.com');
      expect(res.role).toBe('SCHOOL_ADMIN');
      expect(res.schoolName).toBe('Oakridge Academy');
    });

    it('returns valid: false, reason: NOT_FOUND when token hash does not exist', async () => {
      vi.mocked(prisma.userInvitation.findUnique).mockResolvedValue(null);

      const res = await verifyInvitation('non-existent-token');
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('NOT_FOUND');
    });

    it('returns valid: false, reason: ACCEPTED when invitation was already redeemed', async () => {
      vi.mocked(prisma.userInvitation.findUnique).mockResolvedValue({
        id: 'inv-123',
        status: 'ACCEPTED',
        expiresAt: new Date(Date.now() + 3600 * 1000),
        email: 'user@example.com',
        role: 'TEACHER',
        school: null,
      } as never);

      const res = await verifyInvitation('already-accepted-token');
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('ACCEPTED');
    });

    it('returns valid: false, reason: REVOKED when invitation was invalidated', async () => {
      vi.mocked(prisma.userInvitation.findUnique).mockResolvedValue({
        id: 'inv-123',
        status: 'REVOKED',
        expiresAt: new Date(Date.now() + 3600 * 1000),
        email: 'user@example.com',
        role: 'STUDENT',
        school: null,
      } as never);

      const res = await verifyInvitation('revoked-token');
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('REVOKED');
    });

    it('returns valid: false, reason: EXPIRED when timestamp is past expiration', async () => {
      vi.mocked(prisma.userInvitation.findUnique).mockResolvedValue({
        id: 'inv-123',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 3600 * 1000),
        email: 'user@example.com',
        role: 'PARENT',
        school: null,
      } as never);

      const res = await verifyInvitation('expired-token');
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('EXPIRED');
      expect(prisma.userInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-123' },
        data: { status: 'EXPIRED' },
      });
    });
  });

  describe('acceptInvitation', () => {
    it('sets user password via Argon2id, activates user, marks invitation ACCEPTED, and records audit', async () => {
      const mockTx = {
        user: { update: vi.fn() },
        userInvitation: { update: vi.fn() },
        auditLog: { create: vi.fn() },
      };

      vi.mocked(prisma.$transaction).mockImplementation((async (cb: (tx: unknown) => unknown) =>
        cb(mockTx)) as never);

      vi.mocked(prisma.userInvitation.findUnique).mockResolvedValue({
        id: 'inv-123',
        userId: 'user-123',
        schoolId: 'school-1',
        email: 'admin@school.org',
        role: 'SCHOOL_ADMIN',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      } as never);

      const result = await acceptInvitation({
        rawToken: 'valid-activation-token-32-chars-long',
        password: 'ValidPassword123!',
        ipAddress: '127.0.0.1',
      });

      expect(result.success).toBe(true);
      expect(result.email).toBe('admin@school.org');
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          status: 'ACTIVE',
        }),
      });
      expect(mockTx.userInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-123' },
        data: expect.objectContaining({
          status: 'ACCEPTED',
        }),
      });
    });

    it('rejects acceptance if invitation is already accepted', async () => {
      vi.mocked(prisma.userInvitation.findUnique).mockResolvedValue({
        id: 'inv-123',
        userId: 'user-123',
        status: 'ACCEPTED',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      } as never);

      await expect(
        acceptInvitation({
          rawToken: 'already-used-token',
          password: 'ValidPassword123!',
          ipAddress: '127.0.0.1',
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it('rejects acceptance if invitation is expired', async () => {
      vi.mocked(prisma.userInvitation.findUnique).mockResolvedValue({
        id: 'inv-123',
        userId: 'user-123',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 3600 * 1000),
      } as never);

      await expect(
        acceptInvitation({
          rawToken: 'expired-token',
          password: 'ValidPassword123!',
          ipAddress: '127.0.0.1',
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('resendInvitation', () => {
    it('revokes previous invitation and issues a fresh token within transaction', async () => {
      const mockTx = {
        userInvitation: {
          update: vi.fn(),
          create: vi.fn().mockResolvedValue({
            id: 'inv-fresh',
            schoolId: 'school-1',
            userId: 'user-1',
            email: 'teacher@school.edu',
            role: 'TEACHER',
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 168 * 3600 * 1000),
            acceptedAt: null,
            revokedAt: null,
            createdAt: new Date(),
            school: { name: 'Greenwood High' },
          }),
        },
        auditLog: { create: vi.fn() },
      };

      vi.mocked(prisma.$transaction).mockImplementation((async (cb: (tx: unknown) => unknown) =>
        cb(mockTx)) as never);

      vi.mocked(prisma.userInvitation.findUnique).mockResolvedValue({
        id: 'inv-old',
        schoolId: 'school-1',
        userId: 'user-1',
        email: 'teacher@school.edu',
        role: 'TEACHER',
        status: 'PENDING',
        expiresAt: new Date(),
      } as never);

      const resent = await resendInvitation({
        invitationId: 'inv-old',
        schoolId: 'school-1',
        actorId: 'admin-1',
        ipAddress: '127.0.0.1',
      });

      expect(mockTx.userInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-old' },
        data: expect.objectContaining({ status: 'REVOKED' }),
      });
      expect(resent.id).toBe('inv-fresh');
      expect(resent.invitationUrl).toBeDefined();
    });

    it('enforces tenant isolation and throws NotFoundError on cross-tenant resend', async () => {
      vi.mocked(prisma.userInvitation.findUnique).mockResolvedValue({
        id: 'inv-target',
        schoolId: 'school-DIFFERENT',
        status: 'PENDING',
      } as never);

      await expect(
        resendInvitation({
          invitationId: 'inv-target',
          schoolId: 'school-MINE',
          actorId: 'admin-1',
          ipAddress: null,
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('revokeInvitation', () => {
    it('marks invitation as REVOKED and logs audit event', async () => {
      vi.mocked(prisma.userInvitation.findUnique).mockResolvedValue({
        id: 'inv-1',
        schoolId: 'school-1',
        userId: 'user-1',
        email: 'user@example.com',
        role: 'TEACHER',
        status: 'PENDING',
      } as never);

      vi.mocked(prisma.userInvitation.update).mockResolvedValue({
        id: 'inv-1',
        schoolId: 'school-1',
        userId: 'user-1',
        email: 'user@example.com',
        role: 'TEACHER',
        status: 'REVOKED',
        expiresAt: new Date(),
        acceptedAt: null,
        revokedAt: new Date(),
        createdAt: new Date(),
        school: null,
      } as never);

      const revoked = await revokeInvitation({
        invitationId: 'inv-1',
        schoolId: 'school-1',
        actorId: 'admin-1',
        ipAddress: null,
      });

      expect(revoked.status).toBe('REVOKED');
      expect(prisma.userInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: expect.objectContaining({ status: 'REVOKED' }),
        include: { school: { select: { name: true } } },
      });
    });
  });
});
