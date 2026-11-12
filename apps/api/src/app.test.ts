import { describe, it, expect, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from '@fsd-sdg4/validation';
import { createApp } from './app.js';
import * as lifecycle from './shared/database/lifecycle.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { validateRequest } from './shared/validation/validateRequest.js';
import { createApiRateLimiter } from './shared/security/rateLimiter.js';
import { env } from './config/env.js';

const app = createApp({ enableRateLimit: false });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Health and liveness endpoints', () => {
  it('GET /health returns 200 with status ok and security headers', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.version).toBeDefined();
    expect(response.body.environment).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(typeof response.headers['x-request-id']).toBe('string');
  });

  it('GET /api/v1/health returns 200 with status ok', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.version).toBe(env.API_VERSION);
  });
});

describe('GET /api/v1/ready', () => {
  it('returns 200 ready when database readiness check passes', async () => {
    const originalDbUrl = env.DATABASE_URL;
    env.DATABASE_URL = 'postgresql://localhost:5432/test';
    vi.spyOn(lifecycle, 'checkDatabaseReadiness').mockResolvedValue({ ok: true, latencyMs: 2 });

    const response = await request(app).get('/api/v1/ready');
    env.DATABASE_URL = originalDbUrl;

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.checks).toEqual([{ name: 'postgresql', status: 'pass', latencyMs: 2 }]);
  });

  it('returns 503 not_ready when database readiness check fails', async () => {
    const originalDbUrl = env.DATABASE_URL;
    env.DATABASE_URL = 'postgresql://localhost:5432/test';
    vi.spyOn(lifecycle, 'checkDatabaseReadiness').mockResolvedValue({ ok: false, latencyMs: 5 });

    const response = await request(app).get('/api/v1/ready');
    env.DATABASE_URL = originalDbUrl;

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('not_ready');
    expect(response.body.checks[0]?.status).toBe('fail');
  });
});

describe('API v1 system endpoints', () => {
  it('GET /api/v1/ping returns 200 with pong message', async () => {
    const response = await request(app).get('/api/v1/ping');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.message).toBe('pong');
  });

  it('GET /api/v1/openapi.json returns OpenAPI 3.1 specification', async () => {
    const response = await request(app).get('/api/v1/openapi.json');
    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.1.0');
    expect(response.body.paths).toHaveProperty('/health');
    expect(response.body.paths).toHaveProperty('/ready');
    expect(response.body.paths).toHaveProperty('/openapi.json');
  });
});

describe('CORS enforcement', () => {
  it('allows configured origin and exposes X-Request-Id', async () => {
    const response = await request(app).get('/api/v1/ping').set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('rejects disallowed origin with 403 RFC 7807 error', async () => {
    const response = await request(app)
      .get('/api/v1/ping')
      .set('Origin', 'https://malicious.example.com');

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.title).toBe('Forbidden');
  });
});

describe('Error handling and validation', () => {
  it('returns 404 with RFC 7807 error shape for unknown routes', async () => {
    const response = await request(app).get('/api/v1/nonexistent-route');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.title).toBe('Not Found');
    expect(response.body.status).toBe(404);
    expect(typeof response.body.requestId).toBe('string');
  });

  it('returns 400 RFC 7807 error on malformed JSON body', async () => {
    const response = await request(app)
      .post('/api/v1/ping')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.status).toBe(400);
    expect(response.body.title).toBe('Bad Request');
  });

  it('returns 422 RFC 7807 error with FieldError[] on Zod validation failure', async () => {
    const testApp = express();
    testApp.use(requestIdMiddleware);
    testApp.use(express.json());
    testApp.post(
      '/test-validate',
      validateRequest({
        body: z.object({ title: z.string().min(3) }),
      }),
      (_req, res) => {
        res.status(200).json({ ok: true });
      },
    );
    testApp.use(errorHandler);

    const response = await request(testApp).post('/test-validate').send({ title: 'a' });
    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.status).toBe(422);
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].field).toBe('body.title');
  });

  it('returns 429 RFC 7807 error when rate limit is exceeded', async () => {
    const limitedApp = express();
    limitedApp.use(requestIdMiddleware);
    limitedApp.use(createApiRateLimiter({ windowMs: 60_000, limit: 2 }));
    limitedApp.get('/limited', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    expect((await request(limitedApp).get('/limited')).status).toBe(200);
    expect((await request(limitedApp).get('/limited')).status).toBe(200);
    const blocked = await request(limitedApp).get('/limited');

    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
    expect(blocked.body.status).toBe(429);
    expect(blocked.body.title).toBe('Too Many Requests');
    expect(typeof blocked.body.requestId).toBe('string');
  });
});
