import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

const app = createApp();

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.version).toBeDefined();
    expect(response.body.environment).toBeDefined();
  });
});

describe('GET /api/v1/ready', () => {
  it('returns 200 with ready status', async () => {
    const response = await request(app).get('/api/v1/ready');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(Array.isArray(response.body.checks)).toBe(true);
  });
});

describe('GET /api/v1/ping', () => {
  it('returns 200 with pong message', async () => {
    const response = await request(app).get('/api/v1/ping');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.message).toBe('pong');
  });
});

describe('GET /api/v1/nonexistent-route', () => {
  it('returns 404 with RFC 7807 error shape', async () => {
    const response = await request(app).get('/api/v1/nonexistent-route');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.title).toBe('Not Found');
    expect(response.body.status).toBe(404);
    expect(typeof response.body.requestId).toBe('string');
  });
});

describe('Error handler', () => {
  it('responds with consistent RFC 7807 error envelope on unhandled errors', async () => {
    const response = await request(app).get('/this-definitely-does-not-exist');
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('title');
    expect(response.body).toHaveProperty('status');
  });
});
