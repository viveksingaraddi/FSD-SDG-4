export { prisma } from '../db/prisma.js';
export {
  connectDatabase,
  disconnectDatabase,
  checkDatabaseReadiness,
  type DatabaseReadinessResult,
} from './lifecycle.js';
export {
  TENANT_SCOPED_MODELS,
  assertTenantContext,
  buildTenantWhere,
  createTenantScopedPrisma,
  type TenantContext,
} from './tenantScope.js';
