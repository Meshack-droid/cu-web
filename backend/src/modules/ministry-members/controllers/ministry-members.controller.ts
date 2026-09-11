import { Request, Response } from 'express';
import { BaseController } from '../../../core/base.controller';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError } from '../../../utils/errors';
import { MinistryMember } from '../interfaces/ministry-members.interface';
import { MinistryMembersService } from '../services/ministry-members.service';

const service = new MinistryMembersService();

export const ministryMembersController = new BaseController<MinistryMember>(service, 'Ministry roster entry');

export const ministrySelfController = {
  join: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const ministryId = typeof req.body?.ministry_id === 'string' ? req.body.ministry_id : '';
    const result = await service.joinMinistry(req.user.sub, ministryId);
    return sendSuccess(res, result, result.joined ? 'You are now connected to this ministry' : 'Ministry membership updated', 201);
  }),
  leave: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const result = await service.leaveMinistry(req.user.sub, req.params.ministryId);
    return sendSuccess(res, result, 'You have left the ministry');
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const result = await service.myMembership(req.user.sub, req.params.ministryId);
    return sendSuccess(res, result, 'Your ministry membership retrieved');
  }),
  listMine: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const result = await service.listMyMinistries(req.user.sub);
    return sendSuccess(res, result, 'Your active ministry memberships retrieved');
  }),
};
