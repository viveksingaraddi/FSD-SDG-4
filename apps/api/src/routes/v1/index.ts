import { Router, type Router as ExpressRouter } from 'express';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import { buildOpenApiSpec } from '../../docs/openapi.js';
import { createAuthRouter } from '../../modules/auth/auth.routes.js';
import { createSchoolAdminRouter } from '../../modules/school-admin/schoolAdmin.routes.js';
import { createSuperAdminRouter } from '../../modules/super-admin/superAdmin.routes.js';
import { sendSuccess } from '../../shared/http/response.js';

export interface CreateV1RouterOptions {
  enableRateLimit?: boolean;
}

export function createV1Router(options: CreateV1RouterOptions = {}): ExpressRouter {
  const router: ExpressRouter = Router();

  router.get('/api/v1/ping', (_req, res) => {
    sendSuccess(res, { message: 'pong', version: 'v1' });
  });

  router.get(API_ROUTES.OPENAPI, (_req, res) => {
    res.status(200).json(buildOpenApiSpec());
  });

  router.use(createAuthRouter({ enableRateLimit: options.enableRateLimit ?? true }));
  router.use(createSuperAdminRouter());
  router.use(createSchoolAdminRouter());

  return router;
}

export const v1Router: ExpressRouter = createV1Router();
