import { Request, Response } from 'express';
import { MembershipService } from '../services/membership.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError } from '../../../utils/errors';

const membershipService = new MembershipService();

export const membershipController = {
  listApplications: asyncHandler(async (req: Request, res: Response) => {
    const { status, page, pageSize } = req.query as Record<string, string>;
    const result = await membershipService.listApplications(
      status,
      Number(page) || 1,
      Number(pageSize) || 20
    );
    return sendSuccess(res, result.rows, 'Membership applications retrieved', 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const membership = await membershipService.approveApplication(req.params.id, req.user.sub);
    return sendSuccess(res, membership, 'Membership application approved');
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const application = await membershipService.rejectApplication(
      req.params.id,
      req.user.sub,
      req.body.rejectionReason
    );
    return sendSuccess(res, application, 'Membership application rejected');
  }),

  renew: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const membership = await membershipService.renew(
      req.user.sub,
      req.body.spiritualYearId,
      req.body.declarationId
    );
    return sendSuccess(res, membership, 'Membership renewed successfully');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const membership = await membershipService.getMembership(req.params.id);
    return sendSuccess(res, membership, 'Membership retrieved');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const status = await membershipService.getMyStatus(req.user.sub);
    return sendSuccess(res, status, 'Your membership status');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { status, membership_type_id, page, pageSize } = req.query as Record<string, string>;
    const result = await membershipService.listMemberships(
      { status, membership_type_id },
      Number(page) || 1,
      Number(pageSize) || 20
    );
    return sendSuccess(res, result.rows, 'Memberships retrieved', 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  }),
};
