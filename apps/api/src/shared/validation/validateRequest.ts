import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { FieldError } from '@fsd-sdg4/contracts';
import type { z } from '@fsd-sdg4/validation';
import { ValidationError } from '../errors/appError.js';

export interface RequestValidationSchemas<
  TBody extends z.ZodTypeAny = z.ZodTypeAny,
  TParams extends z.ZodTypeAny = z.ZodTypeAny,
  TQuery extends z.ZodTypeAny = z.ZodTypeAny,
> {
  body?: TBody;
  params?: TParams;
  query?: TQuery;
}

export interface ValidatedRequestData<TBody = unknown, TParams = unknown, TQuery = unknown> {
  body?: TBody;
  params?: TParams;
  query?: TQuery;
}

declare global {
  namespace Express {
    interface Request {
      validated?: ValidatedRequestData;
    }
  }
}

function zodIssuesToFieldErrors(
  issues: z.ZodIssue[],
  source: 'body' | 'params' | 'query',
): FieldError[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : source;
    return {
      field: `${source}.${path}`,
      message: issue.message,
      code: issue.code,
    };
  });
}

/**
 * Validates incoming request body, params, and query against Zod schemas.
 * Unknown properties are stripped by default (mass-assignment protection).
 * Parsed values are attached to `req.validated` and `res.locals['validated']`.
 */
export function validateRequest<
  TBody extends z.ZodTypeAny = z.ZodTypeAny,
  TParams extends z.ZodTypeAny = z.ZodTypeAny,
  TQuery extends z.ZodTypeAny = z.ZodTypeAny,
>(schemas: RequestValidationSchemas<TBody, TParams, TQuery>): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const fieldErrors: FieldError[] = [];
    const validated: ValidatedRequestData = {};

    if (schemas.params !== undefined) {
      const result = await schemas.params.safeParseAsync(req.params);
      if (!result.success) {
        fieldErrors.push(...zodIssuesToFieldErrors(result.error.issues, 'params'));
      } else {
        validated.params = result.data;
      }
    }

    if (schemas.query !== undefined) {
      const result = await schemas.query.safeParseAsync(req.query);
      if (!result.success) {
        fieldErrors.push(...zodIssuesToFieldErrors(result.error.issues, 'query'));
      } else {
        validated.query = result.data;
      }
    }

    if (schemas.body !== undefined) {
      const result = await schemas.body.safeParseAsync(req.body);
      if (!result.success) {
        fieldErrors.push(...zodIssuesToFieldErrors(result.error.issues, 'body'));
      } else {
        validated.body = result.data;
        req.body = result.data;
      }
    }

    if (fieldErrors.length > 0) {
      next(new ValidationError('Request validation failed.', fieldErrors));
      return;
    }

    req.validated = validated;
    res.locals['validated'] = validated;
    next();
  };
}
