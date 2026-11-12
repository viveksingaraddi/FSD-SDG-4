import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../shared/errors/appError.js';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Dual-layer CSRF defense complementing SameSite=Lax cookies:
 * State-changing cookie-authenticated requests must supply either a custom
 * `X-Requested-With` header or `Content-Type: application/json`, preventing
 * classic cross-origin HTML form and simple-request CSRF attacks.
 */
export function requireCsrfHeader(req: Request, _res: Response, next: NextFunction): void {
  if (!STATE_CHANGING_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const requestedWith = req.headers['x-requested-with'];
  const hasCustomHeader = typeof requestedWith === 'string' && requestedWith.trim().length > 0;
  const isJsonContentType = req.is('application/json') === 'application/json';

  if (!hasCustomHeader && !isJsonContentType) {
    next(
      new ForbiddenError('CSRF validation failed: missing X-Requested-With or JSON content type.'),
    );
    return;
  }

  next();
}
