import { Prisma } from '@prisma/client';
import type { FieldError } from '@fsd-sdg4/contracts';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly title: string;
  public readonly type: string;
  public readonly errors?: FieldError[] | undefined;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    title: string,
    detail: string,
    type = 'about:blank',
    errors?: FieldError[],
    isOperational = true,
  ) {
    super(detail);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.title = title;
    this.type = type;
    this.errors = errors;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(detail = 'The request is invalid.', errors?: FieldError[]) {
    super(400, 'Bad Request', detail, 'https://api.fsd-sdg4.edu/errors/bad-request', errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(detail = 'Authentication is required.') {
    super(401, 'Unauthorized', detail, 'https://api.fsd-sdg4.edu/errors/unauthorized');
  }
}

export class ForbiddenError extends AppError {
  constructor(detail = 'You do not have permission to perform this action.') {
    super(403, 'Forbidden', detail, 'https://api.fsd-sdg4.edu/errors/forbidden');
  }
}

export class NotFoundError extends AppError {
  constructor(detail = 'The requested resource was not found.') {
    super(404, 'Not Found', detail, 'https://api.fsd-sdg4.edu/errors/not-found');
  }
}

export class ConflictError extends AppError {
  constructor(detail = 'The request conflicts with an existing resource.') {
    super(409, 'Conflict', detail, 'https://api.fsd-sdg4.edu/errors/conflict');
  }
}

export class ValidationError extends AppError {
  constructor(detail = 'Request validation failed.', errors?: FieldError[]) {
    super(
      422,
      'Unprocessable Entity',
      detail,
      'https://api.fsd-sdg4.edu/errors/validation-error',
      errors,
    );
  }
}

export class RateLimitError extends AppError {
  constructor(detail = 'Too many requests. Please try again later.') {
    super(429, 'Too Many Requests', detail, 'https://api.fsd-sdg4.edu/errors/rate-limit-exceeded');
  }
}

/**
 * Maps known Prisma client errors to safe, operational AppError instances
 * without exposing internal table names, constraints, or SQL details.
 */
export function mapPrismaError(error: unknown): AppError | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new ConflictError('A record with the provided unique value already exists.');
      case 'P2003':
        return new BadRequestError(
          'Referenced record does not exist or violates a relational constraint.',
        );
      case 'P2025':
        return new NotFoundError('The requested record could not be found.');
      case 'P2014':
        return new BadRequestError('The requested change violates a required relation.');
      default:
        return null;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new BadRequestError('Invalid data query or input structure.');
  }

  return null;
}
