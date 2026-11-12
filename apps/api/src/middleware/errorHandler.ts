/**
 * Centralized error-handling middleware implementing RFC 7807 Problem Details.
 * Maps AppError, ZodError, malformed JSON, and known Prisma errors into a consistent
 * ApiErrorResponse without leaking stack traces or internal DB details.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse, FieldError } from '@fsd-sdg4/contracts';
import { z } from '@fsd-sdg4/validation';
import { AppError, BadRequestError, mapPrismaError } from '../shared/errors/appError.js';
import { logger } from '../shared/logging/logger.js';

export { AppError };

function isMalformedJsonError(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as unknown as { status?: unknown }).status === 400 &&
    'body' in err
  );
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId;

  const mappedPrisma = mapPrismaError(err);
  const resolvedError =
    mappedPrisma ??
    (isMalformedJsonError(err) ? new BadRequestError('Malformed JSON payload.') : err);

  if (resolvedError instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      type: resolvedError.type,
      title: resolvedError.title,
      status: resolvedError.statusCode,
      detail: resolvedError.message,
      instance: req.originalUrl,
      requestId,
      ...(resolvedError.errors !== undefined ? { errors: resolvedError.errors } : {}),
    };

    if (resolvedError.statusCode >= 500) {
      logger.error({ err: resolvedError, requestId, path: req.originalUrl }, 'Server AppError');
    }

    res.status(resolvedError.statusCode).json(response);
    return;
  }

  if (resolvedError instanceof z.ZodError) {
    const fieldErrors: FieldError[] = resolvedError.issues.map((issue) => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
      code: issue.code,
    }));

    const response: ApiErrorResponse = {
      success: false,
      type: 'https://api.fsd-sdg4.edu/errors/validation-error',
      title: 'Unprocessable Entity',
      status: 422,
      detail: 'Request validation failed.',
      instance: req.originalUrl,
      requestId,
      errors: fieldErrors,
    };

    res.status(422).json(response);
    return;
  }

  logger.error({ err: resolvedError, requestId, path: req.originalUrl }, 'Unhandled error');

  const response: ApiErrorResponse = {
    success: false,
    type: 'https://api.fsd-sdg4.edu/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred.',
    instance: req.originalUrl,
    requestId,
  };

  res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiErrorResponse = {
    success: false,
    type: 'https://api.fsd-sdg4.edu/errors/not-found',
    title: 'Not Found',
    status: 404,
    detail: `Route ${req.method} ${req.originalUrl} does not exist.`,
    instance: req.originalUrl,
    requestId: req.requestId,
  };

  res.status(404).json(response);
}
