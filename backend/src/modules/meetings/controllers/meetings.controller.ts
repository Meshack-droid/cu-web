import { Request, Response } from 'express';
import { BaseController } from '../../../core/base.controller';
import { Meeting } from '../interfaces/meetings.interface';
import { MeetingsService } from '../services/meetings.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError } from '../../../utils/errors';

const service = new MeetingsService();

class MeetingsController extends BaseController<Meeting> {
  constructor() {
    super(service, 'Meeting');
  }

  // Overrides the generic BaseController.create: `called_by` must be the
  // authenticated caller, never a client-supplied value — otherwise anyone
  // with meetings.create could misattribute who called the meeting, which
  // matters for an audit-relevant field like this one.
  create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const meeting = await service.create({ ...req.body, called_by: req.user.sub } as never);
    return sendSuccess(res, meeting, 'Meeting created successfully', 201);
  });

  getAgenda = asyncHandler(async (req: Request, res: Response) => {
    const items = await service.getAgenda(req.params.id);
    return sendSuccess(res, items, 'Agenda retrieved');
  });

  addAgendaItem = asyncHandler(async (req: Request, res: Response) => {
    const item = await service.addAgendaItem(req.params.id, req.body);
    return sendSuccess(res, item, 'Agenda item added', 201);
  });

  reorderAgenda = asyncHandler(async (req: Request, res: Response) => {
    await service.reorderAgenda(req.params.id, req.body.orderedIds);
    return sendSuccess(res, null, 'Agenda reordered');
  });

  confirmAttendance = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    await service.confirmAttendance(
      req.params.id,
      req.body.userId ?? req.user.sub,
      req.body.method ?? 'manual',
      req.body.isVisitor ?? false
    );
    return sendSuccess(res, null, 'Attendance confirmed');
  });

  listAttendance = asyncHandler(async (req: Request, res: Response) => {
    const rows = await service.listAttendance(req.params.id);
    return sendSuccess(res, rows, 'Attendance retrieved');
  });

  recordMinutes = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const minutes = await service.recordMinutes(req.params.id, req.user.sub, req.body.content);
    return sendSuccess(res, minutes, 'Minutes saved');
  });

  getMinutes = asyncHandler(async (req: Request, res: Response) => {
    const minutes = await service.getMinutes(req.params.id);
    return sendSuccess(res, minutes, 'Minutes retrieved');
  });

  approveMinutes = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const minutes = await service.approveMinutes(req.params.id, req.user.sub);
    return sendSuccess(res, minutes, 'Minutes approved');
  });

  listResolutions = asyncHandler(async (req: Request, res: Response) => {
    const rows = await service.listResolutions(req.params.id);
    return sendSuccess(res, rows, 'Resolutions retrieved');
  });

  passResolution = asyncHandler(async (req: Request, res: Response) => {
    const resolution = await service.passResolution(req.params.id, req.body);
    return sendSuccess(res, resolution, 'Resolution recorded', 201);
  });

  archive = asyncHandler(async (req: Request, res: Response) => {
    const meeting = await service.archive(req.params.id);
    return sendSuccess(res, meeting, 'Meeting archived');
  });
}

export const meetingsController = new MeetingsController();
