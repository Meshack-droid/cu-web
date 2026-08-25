import { Request, Response } from 'express';
import { PrayerRequestsService } from '../services/prayer-requests.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError } from '../../../utils/errors';

const service = new PrayerRequestsService();

function canViewConfidential(req: Request): boolean {
  return req.permissions?.has('prayer.view_confidential') ?? false;
}

export const prayerRequestsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const result = await service.list(req.user.sub, canViewConfidential(req), page, pageSize);
    return sendSuccess(res, result.rows, 'Prayer requests retrieved', 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const record = await service.getById(req.params.id, req.user.sub, canViewConfidential(req));
    return sendSuccess(res, record, 'Prayer request retrieved');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const record = await service.create({
      userId: req.user.sub,
      title: req.body.title,
      details: req.body.details,
      privacyLevel: req.body.privacyLevel ?? 'public',
      anonymous: Boolean(req.body.anonymous),
    });
    return sendSuccess(res, record, 'Prayer request submitted', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const record = await service.update(req.params.id, req.user.sub, canViewConfidential(req), req.body);
    return sendSuccess(res, record, 'Prayer request updated');
  }),
};
