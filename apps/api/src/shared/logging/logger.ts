import pino from 'pino';
import { pinoHttp } from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Request } from 'express';
import { env } from '../../config/env.js';

export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.tokenHash',
  '*.secret',
  '*.apiKey',
];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: REDACT_PATHS,
    censor: '[REDACTED]',
  },
  base: {
    service: 'fsd-sdg4-api',
    env: env.NODE_ENV,
  },
});

export function createHttpLogger() {
  return pinoHttp({
    logger,
    genReqId: (req: IncomingMessage) => (req as unknown as Request).requestId,
    customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
      if (err !== undefined || res.statusCode >= 500) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },
    autoLogging: env.NODE_ENV !== 'test',
  });
}
