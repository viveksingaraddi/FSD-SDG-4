import type { Response } from 'express';
import type { ApiMeta, ApiSuccessResponse } from '@fsd-sdg4/contracts';

export function buildPaginationMeta(page: number, limit: number, total: number): ApiMeta {
  const safeLimit = limit > 0 ? limit : 1;
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);
  return {
    page,
    limit: safeLimit,
    total,
    totalPages,
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiMeta,
): Response<ApiSuccessResponse<T>> {
  const payload: ApiSuccessResponse<T> =
    meta !== undefined ? { success: true, data, meta } : { success: true, data };
  return res.status(statusCode).json(payload);
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  pagination: { page: number; limit: number; total: number },
  statusCode = 200,
): Response<ApiSuccessResponse<T[]>> {
  const meta = buildPaginationMeta(pagination.page, pagination.limit, pagination.total);
  return sendSuccess(res, items, statusCode, meta);
}
