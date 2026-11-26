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
  allowedOrigins = parseAllowedOrigins(
    process.env['WEB_URL'] ? `${env.CORS_ORIGIN},${process.env['WEB_URL']}` : env.CORS_ORIGIN,
  ),
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

      if (allowSet.has('*')) {
        callback(null, true);
        return;
      }

      // In development or test, automatically allow local development origins (localhost, 127.0.0.1, ::1, LAN subnets on any port)
      if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
        try {
          const parsed = new URL(origin);
          if (
            parsed.hostname === 'localhost' ||
            parsed.hostname === '127.0.0.1' ||
            parsed.hostname === '::1' ||
            parsed.hostname === '0.0.0.0' ||
            parsed.hostname.endsWith('.localhost') ||
            parsed.hostname.startsWith('192.168.') ||
            parsed.hostname.startsWith('10.') ||
            /^172\.(1[6-9]|2[0-9]|3[01])\./.test(parsed.hostname)
          ) {
            callback(null, true);
            return;
          }
        } catch {
          // Ignore invalid URL format and fall through
        }
      }

      callback(new ForbiddenError('Origin not allowed by CORS policy.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy'],
    maxAge: 600,
  });
}
