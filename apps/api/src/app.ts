import express from 'express';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { createV1Router } from './routes/v1/index.js';
import { createHttpLogger } from './shared/logging/logger.js';
import { createHelmetMiddleware } from './shared/security/helmet.js';
import { createCorsMiddleware } from './shared/security/cors.js';
import { createApiRateLimiter } from './shared/security/rateLimiter.js';

export interface CreateAppOptions {
  enableRateLimit?: boolean;
}

export function createApp(options: CreateAppOptions = {}): express.Application {
  const app = express();
  const enableRateLimit = options.enableRateLimit ?? true;

  app.disable('x-powered-by');
  app.use(requestIdMiddleware);
  app.use(createHelmetMiddleware());
  app.use(createCorsMiddleware());
  app.use(cookieParser());
  app.use(createHttpLogger());

  if (enableRateLimit) {
    app.use(createApiRateLimiter());
  }

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(healthRouter);
  app.use(createV1Router({ enableRateLimit }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
