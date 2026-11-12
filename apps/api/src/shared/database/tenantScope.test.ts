import { describe, it, expect, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { ForbiddenError } from '../errors/appError.js';
import {
  TENANT_SCOPED_MODELS,
  assertTenantContext,
  buildTenantWhere,
  createTenantScopedPrisma,
} from './tenantScope.js';

const VALID_SCHOOL_ID = '11111111-1111-4111-8111-111111111111';

describe('assertTenantContext', () => {
  it('throws ForbiddenError when tenant context or schoolId is missing or invalid', () => {
    expect(() => assertTenantContext(undefined)).toThrow(ForbiddenError);
    expect(() => assertTenantContext(null)).toThrow(ForbiddenError);
    expect(() => assertTenantContext({})).toThrow(ForbiddenError);
    expect(() => assertTenantContext({ schoolId: '' })).toThrow(ForbiddenError);
    expect(() => assertTenantContext({ schoolId: 'not-a-uuid' })).toThrow(ForbiddenError);
  });

  it('passes when schoolId is a valid UUID', () => {
    expect(() => assertTenantContext({ schoolId: VALID_SCHOOL_ID })).not.toThrow();
  });
});

describe('buildTenantWhere', () => {
  it('merges schoolId into where filter and overrides any client-supplied schoolId', () => {
    const result = buildTenantWhere(VALID_SCHOOL_ID, {
      status: 'ACTIVE',
      schoolId: '22222222-2222-4222-8222-222222222222',
    });

    expect(result).toEqual({
      status: 'ACTIVE',
      schoolId: VALID_SCHOOL_ID,
    });
  });

  it('rejects invalid schoolId', () => {
    expect(() => buildTenantWhere('bad-id', { status: 'ACTIVE' })).toThrow(ForbiddenError);
  });
});

describe('createTenantScopedPrisma', () => {
  it('rejects invalid schoolId immediately', () => {
    const mockClient = { $extends: vi.fn() } as unknown as PrismaClient;
    expect(() => createTenantScopedPrisma(mockClient, 'invalid')).toThrow(ForbiddenError);
    expect(mockClient.$extends).not.toHaveBeenCalled();
  });

  it('registers Prisma $extends hook that injects schoolId on tenant-scoped models', async () => {
    let capturedExtension: {
      query: {
        $allModels: {
          $allOperations: (params: {
            model: string;
            operation: string;
            args: Record<string, unknown>;
            query: (args: Record<string, unknown>) => Promise<unknown>;
          }) => Promise<unknown>;
        };
      };
    } | null = null;

    const mockClient = {
      $extends: vi.fn((ext) => {
        capturedExtension = ext;
        return ext;
      }),
    } as unknown as PrismaClient;

    createTenantScopedPrisma(mockClient, VALID_SCHOOL_ID);
    expect(capturedExtension).not.toBeNull();

    const querySpy = vi.fn(async (args) => args);
    const allOps = capturedExtension!.query.$allModels.$allOperations;

    // Tenant-scoped read
    await allOps({
      model: 'StudentProfile',
      operation: 'findMany',
      args: { where: { grade: '5', schoolId: 'attacker-school' } },
      query: querySpy,
    });
    expect(querySpy).toHaveBeenLastCalledWith({
      where: { grade: '5', schoolId: VALID_SCHOOL_ID },
    });

    // Tenant-scoped create
    await allOps({
      model: 'User',
      operation: 'create',
      args: { data: { email: 'test@example.edu' } },
      query: querySpy,
    });
    expect(querySpy).toHaveBeenLastCalledWith({
      data: { email: 'test@example.edu', schoolId: VALID_SCHOOL_ID },
    });

    // Global model untouched
    expect(TENANT_SCOPED_MODELS.has('School')).toBe(false);
    await allOps({
      model: 'School',
      operation: 'findMany',
      args: { where: { isActive: true } },
      query: querySpy,
    });
    expect(querySpy).toHaveBeenLastCalledWith({
      where: { isActive: true },
    });
  });
});
