import type { PrismaClient } from '@prisma/client';
import type { UserRole } from '@fsd-sdg4/contracts';
import { uuidSchema } from '@fsd-sdg4/validation';
import { ForbiddenError } from '../errors/appError.js';

/**
 * Authenticated tenant context for application-level tenant isolation.
 * Note: ADR-0007 (PostgreSQL Row-Level Security) remains Proposed/inactive;
 * tenant isolation in Phase 6 is enforced at the application layer.
 */
export interface TenantContext {
  schoolId: string;
  actorUserId?: string;
  role?: UserRole;
}

/**
 * Models that carry a direct `schoolId` column and must be scoped to a tenant.
 * Global/platform models (School, Role, Permission, RolePermission) are excluded.
 */
export const TENANT_SCOPED_MODELS = new Set<string>([
  'User',
  'UserRoleAssignment',
  'Session',
  'AcademicYear',
  'SchoolClass',
  'Section',
  'Subject',
  'TeacherProfile',
  'TeacherAssignment',
  'StudentProfile',
  'Enrollment',
  'ParentProfile',
  'StudentParentLink',
  'AttendanceSession',
  'AttendanceRecord',
  'LearningResource',
  'Assignment',
  'Submission',
  'Assessment',
  'AssessmentResult',
  'SupportFlag',
  'SupportPlan',
  'InterventionLog',
  'AuditLog',
  'Notification',
]);

export function assertTenantContext(
  ctx?: Partial<TenantContext> | null,
): asserts ctx is TenantContext & { schoolId: string } {
  if (ctx === null || ctx === undefined || typeof ctx.schoolId !== 'string') {
    throw new ForbiddenError('Valid tenant context (schoolId) is required.');
  }

  const parsed = uuidSchema.safeParse(ctx.schoolId);
  if (!parsed.success) {
    throw new ForbiddenError('Valid tenant context (schoolId) is required.');
  }
}

export function buildTenantWhere<T extends Record<string, unknown>>(
  schoolId: string,
  where?: T,
): T & { schoolId: string } {
  assertTenantContext({ schoolId });
  return {
    ...(where ?? ({} as T)),
    schoolId,
  };
}

const READ_AND_MUTATE_WHERE_OPS = new Set<string>([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
]);

const SINGLE_RECORD_WHERE_OPS = new Set<string>([
  'findUnique',
  'findUniqueOrThrow',
  'update',
  'delete',
]);

/**
 * Creates a Prisma client extension that automatically enforces `schoolId`
 * on all tenant-scoped models at the application layer.
 */
export function createTenantScopedPrisma(client: PrismaClient, schoolId: string) {
  assertTenantContext({ schoolId });

  return client.$extends({
    name: 'tenantScope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          const mutableArgs = (args ?? {}) as Record<string, unknown>;

          if (READ_AND_MUTATE_WHERE_OPS.has(operation) || SINGLE_RECORD_WHERE_OPS.has(operation)) {
            const existingWhere = (mutableArgs['where'] ?? {}) as Record<string, unknown>;
            mutableArgs['where'] = { ...existingWhere, schoolId };
          } else if (operation === 'create') {
            const existingData = (mutableArgs['data'] ?? {}) as Record<string, unknown>;
            mutableArgs['data'] = { ...existingData, schoolId };
          } else if (operation === 'createMany' || operation === 'createManyAndReturn') {
            const existingData = mutableArgs['data'];
            if (Array.isArray(existingData)) {
              mutableArgs['data'] = existingData.map((row) => ({
                ...(row as Record<string, unknown>),
                schoolId,
              }));
            } else if (existingData !== null && typeof existingData === 'object') {
              mutableArgs['data'] = { ...(existingData as Record<string, unknown>), schoolId };
            }
          } else if (operation === 'upsert') {
            const existingWhere = (mutableArgs['where'] ?? {}) as Record<string, unknown>;
            const existingCreate = (mutableArgs['create'] ?? {}) as Record<string, unknown>;
            const existingUpdate = (mutableArgs['update'] ?? {}) as Record<string, unknown>;
            mutableArgs['where'] = { ...existingWhere, schoolId };
            mutableArgs['create'] = { ...existingCreate, schoolId };
            mutableArgs['update'] = { ...existingUpdate, schoolId };
          }

          return query(mutableArgs);
        },
      },
    },
  });
}
