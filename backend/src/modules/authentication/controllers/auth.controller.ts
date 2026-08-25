import { Request, Response } from 'express';
import { AuthService, RequestContext } from '../services/auth.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError } from '../../../utils/errors';
import { query } from '../../../config/database';

const authService = new AuthService();

function contextFrom(req: Request): RequestContext {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  };
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    return sendSuccess(
      res,
      result,
      'Registration submitted. Your membership application is pending review.',
      201
    );
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, contextFrom(req));
    return sendSuccess(res, result, 'Login successful');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken, contextFrom(req));
    return sendSuccess(res, result, 'Token refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.body.refreshToken);
    return sendSuccess(res, null, 'Logged out successfully');
  }),

  logoutEverywhere: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    await authService.logoutEverywhere(req.user.sub);
    return sendSuccess(res, null, 'Logged out of all devices');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const roles = await query<{ code: string; name: string; category: string; scope_type: string; scope_id: string | null }[]>(
      `SELECT r.code, r.name, r.category, ur.scope_type, ur.scope_id
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :userId AND ur.is_current = TRUE
        ORDER BY r.category, r.name`,
      { userId: req.user.sub }
    );

    return sendSuccess(
      res,
      { ...req.user, permissions: Array.from(req.permissions ?? []), roles },
      'Current session'
    );
  }),
};
