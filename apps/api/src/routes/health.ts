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

  if (env.DATABASE_URL === undefined || env.DATABASE_URL.trim().length === 0) {
    checks.push({
      name: 'postgresql',
      status: 'fail',
      message: 'DATABASE_URL is not configured.',
    });

    const payload: ReadinessCheckResponse = {
      status: 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    };
    res.status(503).json(payload);
    return;
  }

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
