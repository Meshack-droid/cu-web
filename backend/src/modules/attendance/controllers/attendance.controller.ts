import { Request, Response } from 'express';
import { BaseController } from '../../../core/base.controller';
import { AttendanceRecord } from '../interfaces/attendance.interface';
import { AttendanceService } from '../services/attendance.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError, BadRequestError, NotFoundError } from '../../../utils/errors';

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

  listSessions = asyncHandler(async (_req: Request, res: Response) => {
    const sessions = await service.listSessions();
    return sendSuccess(res, sessions, 'Attendance sessions retrieved');
  });

  getActivePublicSessions = asyncHandler(async (_req: Request, res: Response) => {
    const sessions = await service.listSessions();
    const active = sessions.filter((s) => s.is_active);
    return sendSuccess(res, active, 'Active attendance sessions');
  });

  getSession = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const session = await service.getSession(id);
    if (!session) throw new NotFoundError('Attendance session not found');
    return sendSuccess(res, session, 'Attendance session details');
  });

  createSession = asyncHandler(async (req: Request, res: Response) => {
    const { title, session_type, session_date, start_time, end_time, venue, theme, preacher } = req.body;
    if (!title || !session_date || !start_time || !venue) {
      throw new BadRequestError('Title, date, start time, and venue are required');
    }

    const session = await service.createSession({
      title,
      session_type: session_type || 'sunday_service',
      session_date,
      start_time,
      end_time,
      venue,
      theme,
      preacher,
      created_by: req.user?.sub,
    });

    return sendSuccess(res, session, 'Attendance session and QR code generated successfully', 201);
  });

  updateSession = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await service.updateSession(id, req.body);
    const updated = await service.getSession(id);
    return sendSuccess(res, updated, 'Session updated successfully');
  });

  getSessionRoster = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const roster = await service.getSessionRoster(id);
    return sendSuccess(res, roster, 'Session attendance roster');
  });

  exportCsv = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = (req.params.id || req.query.sessionId || req.query.session_id) as string;
    if (!sessionId) {
      throw new BadRequestError('Session ID is required for export');
    }

    const { filename, csv } = await service.generateRosterCsv(sessionId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  });

  // Public/Guest check-in (scanned from QR code or direct link)
  publicCheckIn = asyncHandler(async (req: Request, res: Response) => {
    const {
      sessionId,
      sessionCode,
      identifier,
      fullName,
      email,
      phoneNumber,
      category,
      visitorType,
      prayerRequest,
      notes,
    } = req.body;

    let targetSessionId = sessionId;
    if (!targetSessionId && sessionCode) {
      const sess = await service.getSession(sessionCode);
      if (sess) targetSessionId = sess.id;
    }

    if (!targetSessionId) {
      throw new BadRequestError('Invalid or missing service session identifier');
    }

    // Check if caller is authenticated
    const userId = req.user?.sub || null;

    const result = await service.checkInMemberOrGuest({
      sessionId: targetSessionId,
      attendableType: 'sunday_service',
      userId,
      identifier,
      fullName,
      email,
      phoneNumber,
      category,
      visitorType,
      method: 'qr_code',
      prayerRequest,
      notes,
    });

    return sendSuccess(res, result, result.message, 200);
  });

  // Self check-in for authenticated members
  selfCheckIn = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const targetSessionId = req.body.attendableId || req.body.sessionId;
    const result = await service.checkInMemberOrGuest({
      sessionId: targetSessionId,
      attendableType: req.body.attendableType || 'sunday_service',
      userId: req.user.sub,
      method: req.body.method || 'self_check_in',
      prayerRequest: req.body.prayerRequest,
      notes: req.body.notes,
    });
    return sendSuccess(res, result, 'Attendance recorded successfully', 201);
  });

  // Leader-recorded: for marking someone present manually
  recordForOthers = asyncHandler(async (req: Request, res: Response) => {
    const targetSessionId = req.body.attendableId || req.body.sessionId;
    const result = await service.checkInMemberOrGuest({
      sessionId: targetSessionId,
      attendableType: req.body.attendableType || 'sunday_service',
      userId: req.body.userId || null,
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      category: req.body.category,
      visitorType: req.body.visitorType,
      method: req.body.method || 'leader_check_in',
      prayerRequest: req.body.prayerRequest,
      notes: req.body.notes,
    });
    return sendSuccess(res, result, 'Attendance recorded', 201);
  });
}

export const attendanceController = new AttendanceController();
