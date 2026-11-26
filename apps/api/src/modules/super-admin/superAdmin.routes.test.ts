import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import { UnauthorizedError } from '../../shared/errors/appError.js';
import { getPermissionsForRole } from '../identity/permissions.js';
import * as superAdminService from './superAdmin.service.js';

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

describe('Super Admin API routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get(API_ROUTES.SUPER_ADMIN.OVERVIEW);
    expect(res.status).toBe(401);
  });

  it('rejects non-SUPER_ADMIN roles with 403', async () => {
    const res = await request(app)
      .get(API_ROUTES.SUPER_ADMIN.SCHOOLS)
      .set('x-test-role', 'SCHOOL_ADMIN');
    expect(res.status).toBe(403);
  });

  it('allows SUPER_ADMIN to fetch overview and schools', async () => {
    vi.spyOn(superAdminService, 'getPlatformOverview').mockResolvedValue({
      totalSchools: 2,
      activeSchools: 2,
      suspendedSchools: 0,
      totalUsers: 25,
      recentAuditEvents: 10,
    });

    const res = await request(app)
      .get(API_ROUTES.SUPER_ADMIN.OVERVIEW)
      .set('x-test-role', 'SUPER_ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.data.totalSchools).toBe(2);
  });

  it('requires X-Requested-With or JSON content-type CSRF defense on POST /schools', async () => {
    const res = await request(app)
      .post(API_ROUTES.SUPER_ADMIN.SCHOOLS)
      .set('x-test-role', 'SUPER_ADMIN')
      .type('form')
      .send('name=Synthetic');

    expect(res.status).toBe(403);
  });

  it('validates and creates a school tenant with CSRF header', async () => {
    vi.spyOn(superAdminService, 'createSchool').mockResolvedValue({
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Synthetic Academy',
      code: 'SYNTH01',
      subdomain: 'synthetic-academy',
      contactEmail: 'admin@synthetic.edu',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      userCount: 0,
      studentCount: 0,
    });

    const res = await request(app)
      .post(API_ROUTES.SUPER_ADMIN.SCHOOLS)
      .set('x-test-role', 'SUPER_ADMIN')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        name: 'Synthetic Academy',
        code: 'SYNTH01',
        subdomain: 'synthetic-academy',
        contactEmail: 'admin@synthetic.edu',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe('SYNTH01');
  });

  it('allows SUPER_ADMIN to filter overview by period', async () => {
    const spy = vi.spyOn(superAdminService, 'getPlatformOverview').mockResolvedValue({
      totalSchools: 5,
      activeSchools: 4,
      suspendedSchools: 1,
      totalUsers: 120,
      recentAuditEvents: 45,
      period: '30d',
    });

    const res = await request(app)
      .get(`${API_ROUTES.SUPER_ADMIN.OVERVIEW}?period=30d`)
      .set('x-test-role', 'SUPER_ADMIN');

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith('30d');
    expect(res.body.data.period).toBe('30d');
  });

  it('allows SUPER_ADMIN to fetch platform settings & governance policies', async () => {
    vi.spyOn(superAdminService, 'getPlatformSettings').mockResolvedValue({
      policies: {
        sessionPolicy: {
          maxAgeSeconds: 604800,
          sameSite: 'lax',
          secure: false,
          httpOnly: true,
        },
        csrfProtection: {
          enabled: true,
          headerName: 'X-CSRF-Token',
        },
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumber: true,
          requireSpecial: true,
          hashingAlgorithm: 'Argon2id',
        },
        tenantIsolation: {
          model: 'Multi-Tenant Shared Schema with Tenant Discriminator (school_id)',
          zeroTrust: true,
          enforcementLayer: 'Session Context resolveTenantSchoolId(req)',
        },
        rateLimiting: {
          globalLimit: 100,
          authLimit: 10,
        },
        emailDelivery: {
          provider: 'Official FSD-SDG-4 Gmail SMTP (Nodemailer TLS)',
          secureTls: true,
        },
      },
      version: '1.0.0',
      environment: 'test',
    });

    const res = await request(app)
      .get(API_ROUTES.SUPER_ADMIN.SETTINGS)
      .set('x-test-role', 'SUPER_ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.data.policies.passwordPolicy.hashingAlgorithm).toBe('Argon2id');
    expect(res.body.data.policies.tenantIsolation.zeroTrust).toBe(true);
  });

  it('allows SUPER_ADMIN to filter audit logs by category', async () => {
    const spy = vi.spyOn(superAdminService, 'listPlatformAuditLogs').mockResolvedValue([
      {
        id: '99999999-9999-4999-8999-999999999999',
        schoolId: null,
        actorId: '11111111-1111-4111-8111-111111111111',
        actorEmail: 'admin@platform.edu',
        action: 'PLATFORM_TENANT_PROVISIONED',
        entityType: 'School',
        entityId: '44444444-4444-4444-8444-444444444444',
        createdAt: new Date().toISOString(),
      },
    ]);

    const res = await request(app)
      .get(`${API_ROUTES.SUPER_ADMIN.AUDIT_LOGS}?category=SCHOOL`)
      .set('x-test-role', 'SUPER_ADMIN');

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(undefined, undefined, 'SCHOOL', undefined, undefined);
    expect(res.body.data).toHaveLength(1);
  });
});
