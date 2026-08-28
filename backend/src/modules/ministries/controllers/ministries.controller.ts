import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { BaseController } from '../../../core/base.controller';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { BadRequestError, NotFoundError, AuthorizationError } from '../../../utils/errors';
import { query } from '../../../config/database';
import { Ministries } from '../interfaces/ministries.interface';
import { MinistriesService } from '../services/ministries.service';

const service = new MinistriesService();

export const ministriesController = new BaseController<Ministries>(service, 'Ministries');

export const ministryDetailsController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const details = await service.getDetails(req.params.id);
    return sendSuccess(res, details, 'Ministry details retrieved');
  }),

  // Get members belonging to this ministry
  getMembers: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const members = await query<any[]>(
      `SELECT mm.*, u.full_name, u.email, u.phone_number, u.admission_number, u.course, u.year_of_study
       FROM ministry_members mm
       JOIN users u ON u.id = mm.user_id
       WHERE mm.ministry_id = :id
       ORDER BY mm.join_date DESC`,
      { id }
    );
    return sendSuccess(res, members, 'Ministry members retrieved');
  }),

  // Get practice / meeting sessions for this ministry
  getSessions: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessions = await query<any[]>(
      `SELECT * FROM attendance_sessions
       WHERE (venue LIKE :minTag OR theme LIKE :minTag OR title LIKE :minTag OR session_type LIKE '%ministry%')
       ORDER BY session_date DESC, start_time DESC`,
      { minTag: `%${id}%` }
    );
    return sendSuccess(res, sessions, 'Ministry practice/meeting sessions');
  }),

  // Ministry Leader / Super Admin: Schedule Practice or Meeting & Generate QR Code
  createSession: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, session_date, start_time, end_time, venue, theme, session_type = 'ministry_practice' } = req.body;

    if (!title || !session_date || !start_time || !venue) {
      throw new BadRequestError('Title, session date, start time, and venue are required');
    }

    const sessionId = `sess-${uuidv4().substring(0, 8)}`;
    const datePart = session_date.replace(/-/g, '').substring(0, 8);
    const randPart = Math.floor(100 + Math.random() * 900);
    const code = `MIN-${datePart}-${randPart}`;

    const newSession = {
      id: sessionId,
      code,
      title: `${title}`,
      session_type,
      session_date,
      start_time,
      end_time: end_time || null,
      venue: `${venue} (${id})`,
      theme: theme || `Ministry Practice & Fellowship - ${id}`,
      preacher: req.user?.username || 'Ministry Leader',
      is_active: 1,
      created_by: req.user?.sub || 'leader',
      created_at: new Date().toISOString(),
    };

    await query(
      `INSERT INTO attendance_sessions (id, code, title, session_type, session_date, start_time, end_time, venue, theme, preacher, is_active, created_by, created_at)
       VALUES (:id, :code, :title, :session_type, :session_date, :start_time, :end_time, :venue, :theme, :preacher, :is_active, :created_by, :created_at)`,
      newSession as any
    );

    return sendSuccess(res, newSession, 'Practice session and QR attendance code generated successfully', 201);
  }),

  // Super Admin: Assign or change Ministry Leader
  assignLeader: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { leader_id } = req.body;

    if (!leader_id) {
      throw new BadRequestError('Leader user ID is required');
    }

    const users = await query<any[]>('SELECT * FROM users WHERE id = :leader_id', { leader_id });
    if (!users || users.length === 0) {
      throw new NotFoundError('User not found');
    }

    await query('UPDATE ministries SET leader_id = :leader_id WHERE id = :id', { id, leader_id });

    // Ensure leader has ministry_leader role with scope
    const existingRole = await query<any[]>(
      'SELECT * FROM user_roles WHERE user_id = :leader_id AND scope_type = "ministry" AND scope_id = :id',
      { leader_id, id }
    );

    if (!existingRole || existingRole.length === 0) {
      await query(
        `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id)
         VALUES (:urId, :leader_id, 'role-9', 'ministry', :id)`,
        { urId: `ur-${uuidv4().substring(0, 6)}`, leader_id, id }
      );
    }

    return sendSuccess(res, { ministry_id: id, leader_id }, 'Ministry leader assigned successfully');
  }),

  // Leader Portal helper: Returns ministry of current leader
  getLeaderPortal: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const isSuperAdmin =
      req.permissions?.has('*') ||
      req.permissions?.has('system.manage_roles') ||
      req.permissions?.has('leadership.assign');

    let ministries: any[] = [];
    if (isSuperAdmin) {
      ministries = await query<any[]>('SELECT * FROM ministries ORDER BY name ASC');
    } else {
      // Find ministries where user is leader or has ministry scope
      ministries = await query<any[]>(
        `SELECT DISTINCT m.* FROM ministries m
         LEFT JOIN user_roles ur ON ur.scope_type = 'ministry' AND ur.scope_id = m.id AND ur.user_id = :userId
         WHERE m.leader_id = :userId OR ur.user_id = :userId`,
        { userId }
      );
    }

    return sendSuccess(res, ministries, 'Leader ministries retrieved');
  }),
};
