import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import { createApp } from '../../app.js';
import * as invitationService from '../invitations/invitation.service.js';
import * as authService from './auth.service.js';
import { UnauthorizedError } from '../../shared/errors/appError.js';
import { getPermissionsForRole } from '../identity/permissions.js';

vi.mock('../invitations/invitation.service.js', () => ({
  verifyInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
}));

vi.mock('./auth.service.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  rotateSessionToken: vi.fn(),
  changePassword: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  listActiveSessions: vi.fn(),
  revokeSession: vi.fn(),
}));

const app = createApp({ enableRateLimit: false });

describe('Auth Activation and First Login Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/auth/invitations/verify', () => {
    it('returns 200 with verification details for a valid token', async () => {
      vi.mocked(invitationService.verifyInvitation).mockResolvedValueOnce({
        valid: true,
        email: 'new.teacher@school.edu',
        role: 'TEACHER',
        schoolName: 'Summit Academy',
      });

      const res = await request(app)
        .get(API_ROUTES.AUTH.INVITATIONS_VERIFY)
        .query({ token: 'valid-activation-token-32-chars-long' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        valid: true,
        email: 'new.teacher@school.edu',
        role: 'TEACHER',
        schoolName: 'Summit Academy',
      });
      expect(invitationService.verifyInvitation).toHaveBeenCalledWith(
        'valid-activation-token-32-chars-long',
      );
    });

    it('returns 200 with valid: false when token is expired or revoked', async () => {
      vi.mocked(invitationService.verifyInvitation).mockResolvedValueOnce({
        valid: false,
        reason: 'EXPIRED',
      });

      const res = await request(app)
        .get(API_ROUTES.AUTH.INVITATIONS_VERIFY)
        .query({ token: 'expired-token-123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        valid: false,
        reason: 'EXPIRED',
      });
    });

    it('returns 422 when token query parameter is missing', async () => {
      const res = await request(app).get(API_ROUTES.AUTH.INVITATIONS_VERIFY);
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/invitations/accept', () => {
    it('activates user account and returns success when password meets complexity', async () => {
      vi.mocked(invitationService.acceptInvitation).mockResolvedValueOnce({
        success: true,
        email: 'new.teacher@school.edu',
        role: 'TEACHER',
        schoolName: 'Summit Academy',
      });

      const res = await request(app).post(API_ROUTES.AUTH.INVITATIONS_ACCEPT).send({
        token: 'valid-activation-token-32-chars-long',
        password: 'SecurePassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        success: true,
        email: 'new.teacher@school.edu',
        role: 'TEACHER',
        schoolName: 'Summit Academy',
      });
      expect(invitationService.acceptInvitation).toHaveBeenCalledWith({
        rawToken: 'valid-activation-token-32-chars-long',
        password: 'SecurePassword123!',
        ipAddress: expect.any(String),
      });
    });

    it('returns 422 when password does not satisfy minimum length policy', async () => {
      const res = await request(app).post(API_ROUTES.AUTH.INVITATIONS_ACCEPT).send({
        token: 'valid-activation-token-32-chars-long',
        password: 'short',
      });

      expect(res.status).toBe(422);
      expect(invitationService.acceptInvitation).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/login (First Login & Role-Aware Routing)', () => {
    it('rejects unactivated / inactive user with 401 without revealing account status', async () => {
      vi.mocked(authService.login).mockRejectedValueOnce(
        new UnauthorizedError('Invalid email or password.'),
      );

      const res = await request(app).post(API_ROUTES.AUTH.LOGIN).send({
        email: 'pending.user@school.edu',
        password: 'SecurePassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.detail).toBe('Invalid email or password.');
    });

    it('successfully logs in activated user, sets HttpOnly session cookie, and returns safe user with role permissions', async () => {
      vi.mocked(authService.login).mockResolvedValueOnce({
        rawToken: 'opaque-session-token-raw-value',
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-teacher-01',
          email: 'active.teacher@school.edu',
          role: 'TEACHER',
          schoolId: 'school-01',
          status: 'ACTIVE',
          permissions: getPermissionsForRole('TEACHER'),
        },
      });

      const res = await request(app).post(API_ROUTES.AUTH.LOGIN).send({
        email: 'active.teacher@school.edu',
        password: 'SecurePassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('TEACHER');
      expect(res.body.data.user.status).toBe('ACTIVE');
      expect(res.body.data.user.schoolId).toBe('school-01');

      // Verifies cookie is set with HttpOnly and Lax
      const cookieHeader = res.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      const cookieStr = Array.isArray(cookieHeader) ? cookieHeader.join(';') : String(cookieHeader);
      expect(cookieStr).toContain('HttpOnly');
      expect(cookieStr).toContain('SameSite=Lax');
    });

    it('supports all 5 platform roles for first login', async () => {
      const roles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as const;

      for (const role of roles) {
        vi.mocked(authService.login).mockResolvedValueOnce({
          rawToken: `session-token-${role}`,
          expiresAt: new Date(Date.now() + 86400000),
          user: {
            id: `user-${role}`,
            email: `${role.toLowerCase()}@platform.edu`,
            role,
            schoolId: role === 'SUPER_ADMIN' ? null : 'school-1',
            status: 'ACTIVE',
            permissions: getPermissionsForRole(role),
          },
        });

        const res = await request(app)
          .post(API_ROUTES.AUTH.LOGIN)
          .send({
            email: `${role.toLowerCase()}@platform.edu`,
            password: 'SecurePassword123!',
          });

        expect(res.status).toBe(200);
        expect(res.body.data.user.role).toBe(role);
        expect(res.body.data.user.permissions).toBeDefined();
      }
    });
  });
});
