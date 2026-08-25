import { Request, Response } from 'express';
import { BaseController } from '../../../core/base.controller';
import { Event } from '../interfaces/events.interface';
import { EventsService } from '../services/events.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';

const service = new EventsService();

class EventsController extends BaseController<Event> {
  constructor() {
    super(service, 'Event');
  }

  listPublic = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const result = await service.listPublic(page, pageSize);
    return sendSuccess(res, result.rows, 'Upcoming events retrieved', 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  });

  approve = asyncHandler(async (req: Request, res: Response) => {
    const event = await service.approve(req.params.id);
    return sendSuccess(res, event, 'Event approved');
  });

  openRegistration = asyncHandler(async (req: Request, res: Response) => {
    const event = await service.openRegistration(req.params.id);
    return sendSuccess(res, event, 'Registration opened');
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const registration = await service.register(req.params.id, {
      userId: req.user?.sub,
      walkInName: req.body.walkInName,
    });
    const message =
      registration.status === 'waitlisted'
        ? 'Event is at capacity — you have been added to the waitlist'
        : 'Registration successful. Your QR ticket is attached.';
    return sendSuccess(res, registration, message, 201);
  });

  checkIn = asyncHandler(async (req: Request, res: Response) => {
    const registration = await service.checkIn(req.body.qrCode);
    return sendSuccess(res, registration, 'Checked in successfully');
  });

  cancelRegistration = asyncHandler(async (req: Request, res: Response) => {
    await service.cancelRegistration(req.params.registrationId);
    return sendSuccess(res, null, 'Registration cancelled');
  });

  listRegistrations = asyncHandler(async (req: Request, res: Response) => {
    const rows = await service.listRegistrations(req.params.id);
    return sendSuccess(res, rows, 'Registrations retrieved');
  });

  archive = asyncHandler(async (req: Request, res: Response) => {
    const event = await service.archive(req.params.id);
    return sendSuccess(res, event, 'Event archived');
  });
}

export const eventsController = new EventsController();
