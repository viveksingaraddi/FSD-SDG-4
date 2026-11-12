import type { NextFunction, Request, Response } from 'express';
import { buildSessionCookieOptions, SESSION_COOKIE_NAME } from '../../middleware/authenticate.js';
import { UnauthorizedError } from '../../shared/errors/appError.js';
import { sendSuccess } from '../../shared/http/response.js';
import type {
  ChangePasswordBody,
  ForgotPasswordBody,
  LoginBody,
  ResetPasswordBody,
  SessionIdParams,
} from './auth.schemas.js';
import * as authService from './auth.service.js';

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.validated?.body as LoginBody;
    const result = await authService.login({
      email: body.email,
      password: body.password,
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    res.cookie(SESSION_COOKIE_NAME, result.rawToken, buildSessionCookieOptions(result.expiresAt));
    sendSuccess(res, { user: result.user }, 200);
  } catch (err) {
    next(err);
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.auth === undefined) {
      throw new UnauthorizedError('Authentication required.');
    }

    await authService.logout({
      sessionId: req.auth.sessionId,
      userId: req.auth.userId,
      schoolId: req.auth.schoolId,
      ipAddress: req.ip ?? null,
    });

    res.clearCookie(SESSION_COOKIE_NAME, buildSessionCookieOptions());
    sendSuccess(res, { loggedOut: true }, 200);
  } catch (err) {
    next(err);
  }
}

export async function meController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.auth === undefined) {
      throw new UnauthorizedError('Authentication required.');
    }

    const user = await authService.getMe(req.auth.userId);
    sendSuccess(res, { user }, 200);
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.validated?.body as ForgotPasswordBody;
    const result = await authService.forgotPassword({
      email: body.email,
      ipAddress: req.ip ?? null,
    });

    // Never return internalResetToken in HTTP responses
    sendSuccess(res, { message: result.message }, 200);
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.validated?.body as ResetPasswordBody;
    await authService.resetPassword({
      token: body.token,
      newPassword: body.newPassword,
      ipAddress: req.ip ?? null,
    });

    res.clearCookie(SESSION_COOKIE_NAME, buildSessionCookieOptions());
    sendSuccess(res, { reset: true }, 200);
  } catch (err) {
    next(err);
  }
}

export async function changePasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.auth === undefined) {
      throw new UnauthorizedError('Authentication required.');
    }

    const body = req.validated?.body as ChangePasswordBody;
    const rotated = await authService.changePassword({
      userId: req.auth.userId,
      currentSessionId: req.auth.sessionId,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    res.cookie(SESSION_COOKIE_NAME, rotated.rawToken, buildSessionCookieOptions(rotated.expiresAt));
    sendSuccess(res, { changed: true }, 200);
  } catch (err) {
    next(err);
  }
}

export async function listSessionsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.auth === undefined) {
      throw new UnauthorizedError('Authentication required.');
    }

    const sessions = await authService.listSessions(req.auth.userId, req.auth.sessionId);
    sendSuccess(res, { sessions }, 200);
  } catch (err) {
    next(err);
  }
}

export async function revokeSessionController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.auth === undefined) {
      throw new UnauthorizedError('Authentication required.');
    }

    const params = req.validated?.params as SessionIdParams;
    await authService.revokeSession({
      userId: req.auth.userId,
      schoolId: req.auth.schoolId,
      sessionId: params.sessionId,
      ipAddress: req.ip ?? null,
    });

    if (params.sessionId === req.auth.sessionId) {
      res.clearCookie(SESSION_COOKIE_NAME, buildSessionCookieOptions());
    }

    sendSuccess(res, { revoked: true }, 200);
  } catch (err) {
    next(err);
  }
}
