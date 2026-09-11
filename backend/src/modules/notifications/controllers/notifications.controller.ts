import { Request, Response } from 'express';
import { NotificationDispatchService } from '../services/notification-dispatch.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError } from '../../../utils/errors';

const service = new NotificationDispatchService();

export const notificationsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const result = await service.listForUser(req.user.sub, page, pageSize);
    return sendSuccess(res, result.rows, 'Notifications retrieved', 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  }),

  unreadCount: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const count = await service.countUnread(req.user.sub);
    return sendSuccess(res, { count }, 'Unread count retrieved');
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    await service.markRead(req.params.id, req.user.sub);
    return sendSuccess(res, null, 'Notification marked read');
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    await service.markAllRead(req.user.sub);
    return sendSuccess(res, null, 'All notifications marked read');
  }),
};
