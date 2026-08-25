import { Request, Response } from 'express';
import { BaseController } from '../../../core/base.controller';
import { AttendanceRecord } from '../interfaces/attendance.interface';
import { AttendanceService } from '../services/attendance.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError } from '../../../utils/errors';

const service = new AttendanceService();

class AttendanceController extends BaseController<AttendanceRecord> {
  constructor() {
    super(service, 'Attendance record');
  }

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const result = await service.listForUser(req.user.sub, page, pageSize);
    return sendSuccess(res, result.rows, 'Your attendance history', 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  });

  // Self check-in: always records the CALLER's own attendance, never someone
  // else's — same identity-enforcement pattern as meetings.controller.ts's
  // create() (the caller can't spoof who they're marking present).
  selfCheckIn = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const record = await service.recordAttendance({
      attendableType: req.body.attendableType,
      attendableId: req.body.attendableId,
      userId: req.user.sub,
      status: 'present',
      method: 'self_check_in',
      visitorType: 'none',
    });
    return sendSuccess(res, record, 'Attendance recorded', 201);
  });

  // Leader-recorded: for marking OTHER people present (e.g. a Ministry
  // Secretary taking manual attendance for their session).
  recordForOthers = asyncHandler(async (req: Request, res: Response) => {
    const record = await service.recordAttendance({
      attendableType: req.body.attendableType,
      attendableId: req.body.attendableId,
      userId: req.body.userId,
      status: req.body.status ?? 'present',
      method: 'leader_check_in',
      visitorType: req.body.visitorType ?? 'none',
    });
    return sendSuccess(res, record, 'Attendance recorded', 201);
  });
}

export const attendanceController = new AttendanceController();
