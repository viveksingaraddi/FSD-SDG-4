import { Router, type Router as ExpressRouter } from 'express';
import { API_ROUTES } from '@fsd-sdg4/contracts';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/authorize.js';
import { requireCsrfHeader } from '../../middleware/csrf.js';
import { createSensitiveRateLimiter } from '../../shared/security/rateLimiter.js';
import { validateRequest } from '../../shared/validation/validateRequest.js';
import { PERMISSIONS } from '../identity/permissions.js';
import {
  acceptInvitationController,
  changePasswordController,
  forgotPasswordController,
  listSessionsController,
  loginController,
  logoutController,
  meController,
  resetPasswordController,
  revokeSessionController,
  verifyInvitationController,
} from './auth.controller.js';
import {
  acceptInvitationBodySchema,
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  resetPasswordBodySchema,
  sessionIdParamsSchema,
  verifyInvitationQuerySchema,
} from './auth.schemas.js';

export interface CreateAuthRouterOptions {
  enableRateLimit?: boolean;
}

export function createAuthRouter(options: CreateAuthRouterOptions = {}): ExpressRouter {
  const router: ExpressRouter = Router();
  const sensitiveLimiter = createSensitiveRateLimiter();
  const applyLimiter = options.enableRateLimit ?? true;

  const loginMiddlewares = applyLimiter
    ? [sensitiveLimiter, validateRequest({ body: loginBodySchema }), loginController]
    : [validateRequest({ body: loginBodySchema }), loginController];

  const forgotMiddlewares = applyLimiter
    ? [
        sensitiveLimiter,
        validateRequest({ body: forgotPasswordBodySchema }),
        forgotPasswordController,
      ]
    : [validateRequest({ body: forgotPasswordBodySchema }), forgotPasswordController];

  const resetMiddlewares = applyLimiter
    ? [
        sensitiveLimiter,
        validateRequest({ body: resetPasswordBodySchema }),
        resetPasswordController,
      ]
    : [validateRequest({ body: resetPasswordBodySchema }), resetPasswordController];

  const verifyMiddlewares = [
    validateRequest({ query: verifyInvitationQuerySchema }),
    verifyInvitationController,
  ];

  const acceptMiddlewares = applyLimiter
    ? [
        sensitiveLimiter,
        validateRequest({ body: acceptInvitationBodySchema }),
        acceptInvitationController,
      ]
    : [validateRequest({ body: acceptInvitationBodySchema }), acceptInvitationController];

  router.post(API_ROUTES.AUTH.LOGIN, ...loginMiddlewares);

  router.post(API_ROUTES.AUTH.LOGOUT, authenticate, requireCsrfHeader, logoutController);

  router.get(API_ROUTES.AUTH.ME, authenticate, meController);

  router.post(API_ROUTES.AUTH.FORGOT_PASSWORD, ...forgotMiddlewares);

  router.post(API_ROUTES.AUTH.RESET_PASSWORD, ...resetMiddlewares);

  router.get(API_ROUTES.AUTH.INVITATIONS_VERIFY, ...verifyMiddlewares);

  router.post(API_ROUTES.AUTH.INVITATIONS_ACCEPT, ...acceptMiddlewares);

  router.post(
    API_ROUTES.AUTH.CHANGE_PASSWORD,
    authenticate,
    requireCsrfHeader,
    requirePermission(PERMISSIONS.AUTH_PASSWORD_CHANGE_SELF),
    validateRequest({ body: changePasswordBodySchema }),
    changePasswordController,
  );

  router.get(
    API_ROUTES.AUTH.SESSIONS,
    authenticate,
    requirePermission(PERMISSIONS.AUTH_SESSIONS_MANAGE_SELF),
    listSessionsController,
  );

  router.delete(
    `${API_ROUTES.AUTH.SESSIONS}/:sessionId`,
    authenticate,
    requireCsrfHeader,
    requirePermission(PERMISSIONS.AUTH_SESSIONS_MANAGE_SELF),
    validateRequest({ params: sessionIdParamsSchema }),
    revokeSessionController,
  );

  return router;
}
