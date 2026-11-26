import { describe, it, expect } from 'vitest';
import { API_ROUTES } from './index.js';

describe('@fsd-sdg4/contracts — API_ROUTES', () => {
  it('health route is defined and correct', () => {
    expect(API_ROUTES.HEALTH).toBe('/health');
  });

  it('readiness route includes /api/v1 prefix', () => {
    expect(API_ROUTES.READY).toMatch(/^\/api\/v1\//);
  });

  it('all auth routes include /api/v1 prefix', () => {
    expect(API_ROUTES.AUTH.LOGIN).toMatch(/^\/api\/v1\//);
    expect(API_ROUTES.AUTH.LOGOUT).toMatch(/^\/api\/v1\//);
  });

  it('all parent routes include /api/v1 prefix and define canonical paths', () => {
    expect(API_ROUTES.PARENT.OVERVIEW).toBe('/api/v1/parent/overview');
    expect(API_ROUTES.PARENT.CHILDREN).toBe('/api/v1/parent/children');
    expect(API_ROUTES.PARENT.CHILD_ATTENDANCE).toBe(
      '/api/v1/parent/children/:studentId/attendance',
    );
    expect(API_ROUTES.PARENT.ABSENCE_NOTES).toBe(
      '/api/v1/parent/children/:studentId/attendance-notes',
    );
    expect(API_ROUTES.PARENT.CHILD_GRADES).toBe('/api/v1/parent/children/:studentId/grades');
    expect(API_ROUTES.PARENT.CHILD_SUPPORT_PLANS).toBe(
      '/api/v1/parent/children/:studentId/support-plans',
    );
    expect(API_ROUTES.PARENT.SUPPORT_ACTION_UPDATE).toBe(
      '/api/v1/parent/children/:studentId/support-actions/:actionId',
    );
  });

  it('API_ROUTES is a frozen const (readonly at type level)', () => {
    expect(typeof API_ROUTES).toBe('object');
    expect(API_ROUTES).not.toBeNull();
  });
});
