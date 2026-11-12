import rateLimit from 'express-rate-limit';
import type { Request, RequestHandler, Response } from 'express';
import type { ApiErrorResponse } from '@fsd-sdg4/contracts';

export interface RateLimiterOptions {
  windowMs?: number;
  limit?: number;
  message?: string;
}

function createRateLimitHandler(detail: string) {
  return (req: Request, res: Response): void => {
    const response: ApiErrorResponse = {
      success: false,
      type: 'https://api.fsd-sdg4.edu/errors/rate-limit-exceeded',
      title: 'Too Many Requests',
      status: 429,
      detail,
      instance: req.originalUrl,
      requestId: req.requestId,
    };
    res.status(429).json(response);
  };
}

export function createApiRateLimiter(options: RateLimiterOptions = {}): RequestHandler {
  const detail = options.message ?? 'Too many requests from this IP. Please try again later.';
  return rateLimit({
    windowMs: options.windowMs ?? 15 * 60 * 1000,
    limit: options.limit ?? 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: createRateLimitHandler(detail),
  });
}

export function createSensitiveRateLimiter(options: RateLimiterOptions = {}): RequestHandler {
  const detail =
    options.message ?? 'Too many sensitive requests from this IP. Please try again later.';
  return rateLimit({
    windowMs: options.windowMs ?? 15 * 60 * 1000,
    limit: options.limit ?? 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: createRateLimitHandler(detail),
  });
}
