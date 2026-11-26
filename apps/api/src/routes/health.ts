import { Router, type Router as ExpressRouter } from 'express';
import type {
  HealthCheckResponse,
  ReadinessCheckResponse,
  ReadinessCheck,
} from '@fsd-sdg4/contracts';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import { env } from '../config/env.js';
import { checkDatabaseReadiness } from '../shared/database/index.js';

export const healthRouter: ExpressRouter = Router();

function buildHealthPayload(): HealthCheckResponse {
  return {
    status: 'ok',
    version: env.API_VERSION,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };
}

healthRouter.get([API_ROUTES.HEALTH, API_ROUTES.V1_HEALTH], (_req, res) => {
  res.status(200).json(buildHealthPayload());
});

healthRouter.get(API_ROUTES.READY, async (_req, res) => {
  const checks: ReadinessCheck[] = [];

  // The database client comes from the Composer service dependency, not from
  // DATABASE_URL, so readiness is decided by probing the live connection.
  const dbResult = await checkDatabaseReadiness();
  if (dbResult.ok) {
    checks.push({
      name: 'postgresql',
      status: 'pass',
      latencyMs: dbResult.latencyMs,
    });

    const payload: ReadinessCheckResponse = {
      status: 'ready',
      checks,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(payload);
    return;
  }

  checks.push({
    name: 'postgresql',
    status: 'fail',
    latencyMs: dbResult.latencyMs,
    message: 'Database connection check failed.',
  });

  const payload: ReadinessCheckResponse = {
    status: 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  };
  res.status(503).json(payload);
});
