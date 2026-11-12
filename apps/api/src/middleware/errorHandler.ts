/**
 * Centralized Express error handler.
 * Serializes all errors into RFC 7807 Problem Details format.
 * Internal stack traces are NEVER sent to clients.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7807
 */

import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse } from '@fsd-sdg4/contracts';
import { ZodError } from 'zod';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

/** Extends Error with optional HTTP status and type fields. */
export class AppError extends Error {
  public readonly status: number;
  public readonly title: string;
  public readonly detail: string;
  public readonly type: string;

  constructor(status: number, title: string, detail: string, type: string = 'about:blank') {
    super(detail);
    this.name = 'AppError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.type = type;
  }
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // Zod validation errors → 422 Unprocessable Entity
  if (err instanceof ZodError) {
    const rawIssues = err.issues || (err as unknown as { errors: unknown[] }).errors || [];
    const response: ApiErrorResponse = {
      success: false,
      type: 'https://fsd-sdg4.dev/errors/validation-error',
      title: 'Validation Error',
      status: 422,
      detail: 'The request body or parameters failed validation.',
      requestId: req.requestId,
      errors: rawIssues.map((e) => ({
        field: Array.isArray(e.path) ? e.path.join('.') : String(e.path ?? ''),
        message: e.message,
        code: e.code,
      })),
    };
    res.status(422).json(response);
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    logger.warn({ requestId: req.requestId, status: err.status, title: err.title }, err.detail);
    const response: ApiErrorResponse = {
      success: false,
      type: err.type,
      title: err.title,
      status: err.status,
      detail: err.detail,
      requestId: req.requestId,
    };
    res.status(err.status).json(response);
    return;
  }

  // Unknown errors — log fully (server-side only), respond generically
  logger.error(
    { requestId: req.requestId, err },
    'Unhandled error reached the global error handler',
  );

  const response: ApiErrorResponse = {
    success: false,
    type: 'https://fsd-sdg4.dev/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail:
      env.NODE_ENV === 'development' && err instanceof Error
        ? err.message
        : 'An unexpected error occurred. Please try again later.',
    requestId: req.requestId,
  };
  res.status(500).json(response);
}

/** Express handler for 404 — route not matched */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(
    new AppError(
      404,
      'Not Found',
      `The requested resource was not found: ${req.method} ${req.path}`,
      'https://fsd-sdg4.dev/errors/not-found',
    ),
  );
}
