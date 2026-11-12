import { describe, it, expect, vi } from 'vitest';
import type { Response } from 'express';
import { buildPaginationMeta, sendPaginated, sendSuccess } from './response.js';

function createMockResponse() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const res = { status, json } as unknown as Response;
  return { res, status, json };
}

describe('buildPaginationMeta', () => {
  it('computes totalPages accurately', () => {
    expect(buildPaginationMeta(1, 20, 45)).toEqual({
      page: 1,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it('handles zero total items', () => {
    expect(buildPaginationMeta(1, 20, 0)).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  });
});

describe('sendSuccess', () => {
  it('sends standard ApiSuccessResponse envelope', () => {
    const { res, status, json } = createMockResponse();
    sendSuccess(res, { id: '123' }, 201);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: { id: '123' },
    });
  });
});

describe('sendPaginated', () => {
  it('sends ApiSuccessResponse with computed pagination meta', () => {
    const { res, status, json } = createMockResponse();
    sendPaginated(res, [{ id: '1' }, { id: '2' }], { page: 2, limit: 2, total: 5 });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: '1' }, { id: '2' }],
      meta: {
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
      },
    });
  });
});
