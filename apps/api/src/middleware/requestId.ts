/**
 * Request ID middleware — attaches a unique requestId to every incoming request.
 * The requestId is used for structured log correlation and included in error responses.
 */

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
