/**
 * Express application factory.
 * Separated from server.ts to allow integration tests to construct
 * the app without binding to a network port.
 */

import express from 'express';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { v1Router } from './routes/v1/index.js';

export function createApp(): express.Application {
  const app = express();

  // ─── Security & Parsing Middleware ──────────────────────────────────────
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(requestIdMiddleware);

  // ─── Routes ─────────────────────────────────────────────────────────────
  app.use(healthRouter);
  app.use(v1Router);

  // ─── 404 & Error Handlers ───────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
