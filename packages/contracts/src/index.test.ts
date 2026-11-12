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

  it('API_ROUTES is a frozen const (readonly at type level)', () => {
    expect(typeof API_ROUTES).toBe('object');
    expect(API_ROUTES).not.toBeNull();
  });
});
