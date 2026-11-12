import { describe, it, expect, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { z } from '@fsd-sdg4/validation';
import { validateRequest } from './validateRequest.js';
import { ValidationError } from '../errors/appError.js';

function createMockReqRes(overrides: Partial<Request> = {}) {
  const req = {
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as Request;
  const res = {
    locals: {},
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('validateRequest', () => {
  const bodySchema = z.object({
    name: z.string().min(2),
    count: z.coerce.number().int().min(1),
  });

  const paramsSchema = z.object({
    id: z.string().uuid(),
  });

  it('strips unknown fields (mass-assignment protection) and attaches validated output', async () => {
    const { req, res, next } = createMockReqRes({
      body: {
        name: 'Section A',
        count: '3',
        schoolId: 'attacker-injected-id',
        role: 'SUPER_ADMIN',
      },
      params: {
        id: '11111111-1111-4111-8111-111111111111',
      },
    });

    const middleware = validateRequest({ body: bodySchema, params: paramsSchema });
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Section A', count: 3 });
    expect(req.validated?.body).toEqual({ name: 'Section A', count: 3 });
    expect(req.validated?.params).toEqual({ id: '11111111-1111-4111-8111-111111111111' });
    expect(res.locals['validated']).toEqual(req.validated);
  });

  it('forwards ValidationError with FieldError details when validation fails', async () => {
    const { req, res, next } = createMockReqRes({
      body: { name: 'A', count: 0 },
      params: { id: 'not-a-uuid' },
    });

    const middleware = validateRequest({ body: bodySchema, params: paramsSchema });
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).statusCode).toBe(422);
    expect((err as ValidationError).errors?.length).toBeGreaterThanOrEqual(3);
    expect((err as ValidationError).errors?.map((e) => e.field)).toContain('params.id');
    expect((err as ValidationError).errors?.map((e) => e.field)).toContain('body.name');
  });
});
