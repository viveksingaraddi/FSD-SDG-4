import { Router, type Router as ExpressRouter } from 'express';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import {
  auditLogsQuerySchema,
  createSchoolSchema,
  idParamSchema,
  invitationFilterQuerySchema,
  type InvitationFilterQuery,
  overviewQuerySchema,
  schoolStatusSchema,
  searchQuerySchema,
  superAdminInviteAdminSchema,
  updateSchoolSchema,
  updateUserStatusSchema,
  userFilterQuerySchema,
  type UserFilterQuery,
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
  getPlatformSettings,
  getPlatformUserById,
  getSchoolById,
  inviteSchoolAdministrator,
  listPlatformAuditLogs,
  listPlatformInvitations,
  listPlatformUsers,
  listSchools,
  resendPlatformInvitation,
  revokePlatformInvitation,
  updatePlatformUserStatus,
  updateSchool,
} from './superAdmin.service.js';

const searchParamsSchema = z.object({
  search: searchQuerySchema,
  status: schoolStatusSchema.optional(),
});

export function createSuperAdminRouter(): ExpressRouter {
  const router: ExpressRouter = Router();

  router.get(
    API_ROUTES.SUPER_ADMIN.OVERVIEW,
    authenticate,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_SCHOOLS_READ),
    validateRequest({ query: overviewQuerySchema }),
    async (req, res) => {
      const { period } = req.query as { period?: 'all' | '30d' | '90d' | 'year' };
      const overview = await (period !== undefined
        ? getPlatformOverview(period)
        : getPlatformOverview());
      sendSuccess(res, overview);
    },
  );

  router.get(
    API_ROUTES.SUPER_ADMIN.SETTINGS,
    authenticate,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_AUDIT_READ),
    async (_req, res) => {
      const settings = await getPlatformSettings();
      sendSuccess(res, settings);
    },
  );

  router.get(
    API_ROUTES.SUPER_ADMIN.SCHOOLS,
    authenticate,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_SCHOOLS_READ),
    validateRequest({ query: searchParamsSchema }),
    async (req, res) => {
      const { search, status } = req.query as {
        search?: string;
        status?: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
      };
      const schools = await listSchools(search, status);
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
    validateRequest({ query: auditLogsQuerySchema }),
    async (req, res) => {
      const { action, schoolId, category, startDate, endDate } = req.query as {
        action?: string;
        schoolId?: string;
        category?: 'ALL' | 'AUTH' | 'SCHOOL' | 'ACADEMIC' | 'USER' | 'SETTINGS';
        startDate?: string;
        endDate?: string;
      };
      const logs = await listPlatformAuditLogs(action, schoolId, category, startDate, endDate);
      sendSuccess(res, logs);
    },
  );

  router.get(
    API_ROUTES.SUPER_ADMIN.INVITATIONS,
    authenticate,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_SCHOOLS_READ),
    validateRequest({ query: invitationFilterQuerySchema }),
    async (req, res) => {
      const invitations = await listPlatformInvitations(
        req.query as unknown as InvitationFilterQuery,
      );
      sendSuccess(res, invitations);
    },
  );

  router.post(
    `${API_ROUTES.SUPER_ADMIN.INVITATIONS}/:id/resend`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_SCHOOLS_CREATE),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const { id } = req.params as { id: string };
      const resent = await resendPlatformInvitation(id, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, resent);
    },
  );

  router.delete(
    `${API_ROUTES.SUPER_ADMIN.INVITATIONS}/:id`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_SCHOOLS_DEACTIVATE),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const { id } = req.params as { id: string };
      const revoked = await revokePlatformInvitation(id, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, revoked);
    },
  );

  // ─── Platform Users Lifecycle Management (Task 13) ───────────────────────

  router.get(
    API_ROUTES.SUPER_ADMIN.USERS,
    authenticate,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_USERS_READ),
    validateRequest({ query: userFilterQuerySchema }),
    async (req, res) => {
      const result = await listPlatformUsers(req.query as unknown as UserFilterQuery);
      sendSuccess(res, result);
    },
  );

  router.post(
    `${API_ROUTES.SUPER_ADMIN.USERS}/invite`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_USERS_MANAGE),
    validateRequest({ body: superAdminInviteAdminSchema }),
    async (req, res) => {
      const invitation = await inviteSchoolAdministrator(
        req.body,
        req.auth!.userId,
        req.ip ?? null,
      );
      sendSuccess(res, invitation, 201);
    },
  );

  router.get(
    `${API_ROUTES.SUPER_ADMIN.USERS}/:id`,
    authenticate,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_USERS_READ),
    validateRequest({ params: idParamSchema }),
    async (req, res) => {
      const { id } = req.params as { id: string };
      const user = await getPlatformUserById(id);
      sendSuccess(res, user);
    },
  );

  router.patch(
    `${API_ROUTES.SUPER_ADMIN.USERS}/:id/status`,
    authenticate,
    requireCsrfHeader,
    requireRole(['SUPER_ADMIN']),
    requirePermission(PERMISSIONS.PLATFORM_USERS_MANAGE),
    validateRequest({ params: idParamSchema, body: updateUserStatusSchema }),
    async (req, res) => {
      const { id } = req.params as { id: string };
      const { status } = req.body as { status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' };
      const updated = await updatePlatformUserStatus(id, status, req.auth!.userId, req.ip ?? null);
      sendSuccess(res, updated);
    },
  );

  return router;
}
