import { Router, type Router as ExpressRouter } from 'express';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import {
  createSchoolSchema,
  idParamSchema,
  searchQuerySchema,
  updateSchoolSchema,
  z,
} from '@fsd-sdg4/validation';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission, requireRole } from '../../middleware/authorize.js';
import { requireCsrfHeader } from '../../middleware/csrf.js';
import { sendSuccess } from '../../shared/http/response.js';
import { validateRequest } from '../../shared/validation/validateRequest.js';
import { PERMISSIONS } from '../identity/permissions.js';
import {
  createSchool,
  getPlatformOverview,
  getSchoolById,
  listPlatformAuditLogs,
  listSchools,
  updateSchool,
} from './superAdmin.service.js';

const searchParamsSchema = z.object({
  search: searchQuerySchema,
});

const auditQuerySchema = z.object({
  action: searchQuerySchema,
});

export function createSuperAdminRouter(): ExpressRouter {
  const router: ExpressRouter = Router();

  router.get(
    API_ROUTES.SUPER_ADMIN.OVERVIEW,
    authenticate,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_SCHOOLS_READ),
    async (_req, res) => {
      const overview = await getPlatformOverview();
      sendSuccess(res, overview);
    },
  );

  router.get(
    API_ROUTES.SUPER_ADMIN.SCHOOLS,
    authenticate,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_SCHOOLS_READ),
    validateRequest({ query: searchParamsSchema }),
    async (req, res) => {
      const { search } = req.query as { search?: string };
      const schools = await listSchools(search);
      sendSuccess(res, schools);
    },
  );

  router.get(
    `${API_ROUTES.SUPER_ADMIN.SCHOOLS}/:id`,
    authenticate,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_SCHOOLS_READ),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const { id } = req.params as { id: string };
      const school = await getSchoolById(id);
      sendSuccess(res, school);
    },
  );

  router.post(
    API_ROUTES.SUPER_ADMIN.SCHOOLS,
    authenticate,
    requireCsrfHeader,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_SCHOOLS_CREATE),
    validateRequest({ body: createSchoolSchema }),
    async (req, res) => {
      const created = await createSchool(req.body, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, created, 201);
    },
  );

  router.patch(
    `${API_ROUTES.SUPER_ADMIN.SCHOOLS}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_SCHOOLS_UPDATE),
    validateRequest({ params: idParamSchema, body: updateSchoolSchema }),
    async (req, res) => {
      const { id } = req.params as { id: string };
      const updated = await updateSchool(id, req.body, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, updated);
    },
  );

  router.get(
    API_ROUTES.SUPER_ADMIN.AUDIT_LOGS,
    authenticate,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_AUDIT_READ),
    validateRequest({ query: auditQuerySchema }),
    async (req, res) => {
      const { action } = req.query as { action?: string };
      const logs = await listPlatformAuditLogs(action);
      sendSuccess(res, logs);
    },
  );

  return router;
}
