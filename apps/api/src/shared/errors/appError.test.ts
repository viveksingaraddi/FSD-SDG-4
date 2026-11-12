import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  mapPrismaError,
} from './appError.js';

describe('AppError hierarchy', () => {
  it('constructs operational errors with expected status codes and titles', () => {
    const cases = [
      { err: new BadRequestError('bad'), status: 400, title: 'Bad Request' },
      { err: new ForbiddenError('nope'), status: 403, title: 'Forbidden' },
      { err: new NotFoundError('missing'), status: 404, title: 'Not Found' },
      { err: new ConflictError('dup'), status: 409, title: 'Conflict' },
      {
        err: new ValidationError('invalid', [{ field: 'body.name', message: 'Required' }]),
        status: 422,
        title: 'Unprocessable Entity',
      },
      { err: new RateLimitError('slow down'), status: 429, title: 'Too Many Requests' },
    ];

    for (const c of cases) {
      expect(c.err).toBeInstanceOf(AppError);
      expect(c.err).toBeInstanceOf(Error);
      expect(c.err.statusCode).toBe(c.status);
      expect(c.err.title).toBe(c.title);
      expect(c.err.isOperational).toBe(true);
    }
  });
});

describe('mapPrismaError', () => {
  const makeKnownError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('Internal table users_pkey failed', {
      code,
      clientVersion: '6.19.3',
    });

  it('maps P2002 to ConflictError without leaking internal table names', () => {
    const mapped = mapPrismaError(makeKnownError('P2002'));
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).not.toContain('users_pkey');
  });

  it('maps P2003 to BadRequestError', () => {
    const mapped = mapPrismaError(makeKnownError('P2003'));
    expect(mapped).toBeInstanceOf(BadRequestError);
    expect(mapped?.statusCode).toBe(400);
  });

  it('maps P2025 to NotFoundError', () => {
    const mapped = mapPrismaError(makeKnownError('P2025'));
    expect(mapped).toBeInstanceOf(NotFoundError);
    expect(mapped?.statusCode).toBe(404);
  });

  it('maps P2014 to BadRequestError', () => {
    const mapped = mapPrismaError(makeKnownError('P2014'));
    expect(mapped).toBeInstanceOf(BadRequestError);
    expect(mapped?.statusCode).toBe(400);
  });

  it('maps PrismaClientValidationError to BadRequestError', () => {
    const err = new Prisma.PrismaClientValidationError('Bad query', { clientVersion: '6.19.3' });
    const mapped = mapPrismaError(err);
    expect(mapped).toBeInstanceOf(BadRequestError);
    expect(mapped?.statusCode).toBe(400);
  });

  it('returns null for unknown Prisma codes or non-Prisma errors', () => {
    expect(mapPrismaError(makeKnownError('P9999'))).toBeNull();
    expect(mapPrismaError(new Error('generic'))).toBeNull();
  });
});
