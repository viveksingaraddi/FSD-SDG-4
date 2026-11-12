/**
 * Health and readiness endpoints.
 * GET /health  — Liveness probe (always returns 200 if process is alive)
 * GET /api/v1/ready — Readiness probe (checks dependency availability)
 *
 * Phase 5 will add real database connectivity checks to the readiness probe.
 */

import { Router } from 'express';
import type { HealthCheckResponse, ReadinessCheckResponse } from '@fsd-sdg4/contracts';
import { env } from '../config/env.js';

export const healthRouter: Router = Router();

healthRouter.get('/health', (_req, res) => {
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: env.API_VERSION,
    environment: env.NODE_ENV,
  };
  res.status(200).json(response);
});

healthRouter.get('/api/v1/ready', (_req, res) => {
  const response: ReadinessCheckResponse = {
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: [
      {
        name: 'database',
        status: 'pass',
        message: 'Database connectivity check not yet implemented (Phase 5)',
      },
    ],
  };
  res.status(200).json(response);
});
