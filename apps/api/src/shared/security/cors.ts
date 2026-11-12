import cors from 'cors';
import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { ForbiddenError } from '../errors/appError.js';

export function parseAllowedOrigins(corsOriginEnv: string): string[] {
  return corsOriginEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function createCorsMiddleware(
  allowedOrigins = parseAllowedOrigins(env.CORS_ORIGIN),
): RequestHandler {
  const allowSet = new Set(allowedOrigins);

  return cors({
    origin: (origin, callback) => {
      // Allow non-browser / same-origin requests without an Origin header
      if (origin === undefined) {
        callback(null, true);
        return;
      }

      if (allowSet.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new ForbiddenError('Origin not allowed by CORS policy.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy'],
    maxAge: 600,
  });
}
