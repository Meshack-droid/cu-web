import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError } from '../../../utils/errors';

const service = new AdminService();

export const adminController = {
  searchUsers: asyncHandler(async (req: Request, res: Response) => {
    const { q, page, pageSize } = req.query as Record<string, string>;
    const result = await service.searchUsers(q ?? '', Number(page) || 1, Number(pageSize) || 20);
    return sendSuccess(res, result.rows, 'Users found', 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  }),

  listRoles: asyncHandler(async (_req: Request, res: Response) => {
    const roles = await service.listRoles();
    return sendSuccess(res, roles, 'Roles retrieved');
  }),

  listRolePermissionMatrix: asyncHandler(async (_req: Request, res: Response) => {
    const matrix = await service.listRolePermissionMatrix();
    return sendSuccess(res, matrix, 'Role permission matrix retrieved');
  }),

  listMinistries: asyncHandler(async (_req: Request, res: Response) => {
    const ministries = await service.listMinistries();
    return sendSuccess(res, ministries, 'Ministries retrieved');
  }),

  listCommittees: asyncHandler(async (_req: Request, res: Response) => {
    const committees = await service.listCommittees();
    return sendSuccess(res, committees, 'Committees retrieved');
  }),

  listUserRoles: asyncHandler(async (req: Request, res: Response) => {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const assignments = await service.listUserRoles(userId);
    return sendSuccess(res, assignments, 'Role assignments retrieved');
  }),

  assignRole: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const result = await service.assignRole({ ...req.body, assignedBy: req.user.sub });
    return sendSuccess(res, result, 'Role assigned successfully', 201);
  }),

  revokeRole: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    await service.revokeRole(req.params.id, req.user.sub);
    return sendSuccess(res, null, 'Role assignment ended');
  }),
};
