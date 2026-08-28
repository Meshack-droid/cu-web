import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';
import { BaseRepository } from '../../../core/base.repository';
import {
  AttendanceRecord,
  AttendanceSession,
  AttendeeRosterItem,
} from '../interfaces/attendance.interface';

export class AttendanceRepository extends BaseRepository<AttendanceRecord> {
  constructor() {
    super('attendance_records');
  }

  /**
   * Self-service: a member's own attendance history across every attendable type.
   */
  async listForUser(userId: string, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const countRows = await query<{ total: number }[]>(
      `SELECT
         (SELECT COUNT(*) FROM attendance_records WHERE user_id = :userId) +
         (SELECT COUNT(*) FROM meeting_attendance_confirmations WHERE user_id = :userId)
         AS total`,
      { userId }
    );
    const total = countRows[0]?.total ?? 0;

    const rows = await query<AttendanceRecord[]>(
      `SELECT id, attendable_type, attendable_id, user_id, status, method, visitor_type, checked_in_at FROM (
         SELECT id, attendable_type, attendable_id, user_id, status, method, visitor_type, checked_in_at
           FROM attendance_records WHERE user_id = :userId
         UNION ALL
         SELECT id, 'meeting' AS attendable_type, meeting_id AS attendable_id, user_id,
                CASE arrival_status
                  WHEN 'on_time' THEN 'present'
                  WHEN 'late' THEN 'late'
                  WHEN 'excused' THEN 'excused'
                  ELSE 'absent'
                END AS status,
                method, IF(is_visitor, 'first_time', 'none') AS visitor_type, confirmed_at AS checked_in_at
           FROM meeting_attendance_confirmations WHERE user_id = :userId
       ) combined
       ORDER BY checked_in_at DESC
       LIMIT :limit OFFSET :offset`,
      { userId, limit: pageSize, offset }
    );

    return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  /**
   * List all attendance sessions (Sunday services, Bible studies, Keshas, meetings)
   * with calculated attendee totals.
   */
  async listSessions(): Promise<AttendanceSession[]> {
    const sessions = await query<AttendanceSession[]>(
      `SELECT * FROM attendance_sessions ORDER BY session_date DESC, start_time DESC`
    );

    const allRecords = await query<AttendanceRecord[]>(`SELECT * FROM attendance_records`);

    return sessions.map((sess) => {
      const matchedRecords = allRecords.filter(
        (r) => r.session_id === sess.id || r.attendable_id === sess.id
      );
      const membersCount = matchedRecords.filter((r) => !!r.user_id).length;
      const visitorsCount = matchedRecords.filter((r) => !r.user_id).length;

      return {
        ...sess,
        attendees_count: matchedRecords.length,
        members_count: membersCount,
        visitors_count: visitorsCount,
      };
    });
  }

  /**
   * Get an attendance session by its ID or its short QR code (e.g. SUN-2026-0830).
   */
  async getSessionByIdOrCode(idOrCode: string): Promise<AttendanceSession | null> {
    const rows = await query<AttendanceSession[]>(
      `SELECT * FROM attendance_sessions WHERE id = :idOrCode OR code = :idOrCode LIMIT 1`,
      { idOrCode }
    );
    if (!rows || rows.length === 0) return null;

    const sess = rows[0];
    const records = await query<AttendanceRecord[]>(
      `SELECT * FROM attendance_records WHERE session_id = :id OR attendable_id = :id`,
      { id: sess.id }
    );

    return {
      ...sess,
      attendees_count: records.length,
      members_count: records.filter((r) => !!r.user_id).length,
      visitors_count: records.filter((r) => !r.user_id).length,
    };
  }

  /**
   * Create or generate a new attendance session with a unique code for QR generation.
   */
  async createSession(data: {
    title: string;
    session_type: string;
    session_date: string;
    start_time: string;
    end_time?: string | null;
    venue: string;
    theme?: string | null;
    preacher?: string | null;
    created_by?: string;
  }): Promise<AttendanceSession> {
    const id = `sess-${uuidv4().substring(0, 8)}`;
    const prefix = data.session_type === 'sunday_service' ? 'SUN' : data.session_type === 'bible_study' ? 'MID' : 'TUMCU';
    const datePart = data.session_date.replace(/-/g, '').substring(0, 8);
    const randPart = Math.floor(100 + Math.random() * 900);
    const code = `${prefix}-${datePart}-${randPart}`;

    const newSession: AttendanceSession = {
      id,
      code,
      title: data.title,
      session_type: data.session_type,
      session_date: data.session_date,
      start_time: data.start_time,
      end_time: data.end_time || null,
      venue: data.venue,
      theme: data.theme || null,
      preacher: data.preacher || null,
      is_active: 1,
      created_by: data.created_by || 'system',
      created_at: new Date().toISOString(),
    };

    await query(
      `INSERT INTO attendance_sessions (id, code, title, session_type, session_date, start_time, end_time, venue, theme, preacher, is_active, created_by, created_at)
       VALUES (:id, :code, :title, :session_type, :session_date, :start_time, :end_time, :venue, :theme, :preacher, :is_active, :created_by, :created_at)`,
      newSession as unknown as Record<string, unknown>
    );

    return newSession;
  }

  /**
   * Update session status (e.g. toggle active/inactive).
   */
  async updateSession(id: string, updates: Partial<AttendanceSession>): Promise<boolean> {
    await query(`UPDATE attendance_sessions SET is_active = :is_active WHERE id = :id`, {
      id,
      ...updates,
    });
    return true;
  }

  /**
   * Get full attendee roster for a session, joining member names/contacts or visitor inputs.
   */
  async getSessionRoster(sessionId: string): Promise<AttendeeRosterItem[]> {
    const rows = await query<AttendeeRosterItem[]>(
      `SELECT * FROM attendance_records WHERE session_id = :sessionId OR attendable_id = :sessionId ORDER BY checked_in_at DESC`,
      { sessionId }
    );
    return rows;
  }

  /**
   * Check in a member or visitor.
   */
  async recordPublicOrGuestAttendance(data: {
    sessionId: string;
    attendableType?: string;
    userId?: string | null;
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    category?: string | null;
    visitorType?: string;
    method?: string;
    notes?: string | null;
    prayerRequest?: string | null;
  }) {
    const id = `att-${uuidv4().substring(0, 8)}`;
    const attendableType = data.attendableType || 'sunday_service';
    const method = data.method || 'qr_code';
    const visitorType = data.userId ? 'none' : (data.visitorType || 'first_time');

    const newRecord: AttendanceRecord = {
      id,
      session_id: data.sessionId,
      attendable_type: attendableType as any,
      attendable_id: data.sessionId,
      user_id: data.userId || null,
      guest_name: data.fullName || null,
      guest_email: data.email || null,
      guest_phone: data.phoneNumber || null,
      guest_category: data.category || null,
      status: 'present',
      method: method as any,
      visitor_type: visitorType as any,
      checked_in_at: new Date().toISOString(),
      notes: data.notes || null,
      prayer_request: data.prayerRequest || null,
    };

    await query(
      `INSERT INTO attendance_records (id, session_id, attendable_type, attendable_id, user_id, guest_name, guest_email, guest_phone, guest_category, status, method, visitor_type, notes, prayer_request, checked_in_at)
       VALUES (:id, :session_id, :attendable_type, :attendable_id, :user_id, :guest_name, :guest_email, :guest_phone, :guest_category, :status, :method, :visitor_type, :notes, :prayer_request, :checked_in_at)`,
      newRecord as unknown as Record<string, unknown>
    );

    return newRecord;
  }

  /** Upserts member attendance */
  async recordAttendance(data: {
    attendableType: string;
    attendableId: string;
    userId: string;
    status: string;
    method: string;
    visitorType: string;
  }) {
    const id = `att-${uuidv4().substring(0, 8)}`;
    await query(
      `INSERT INTO attendance_records (id, session_id, attendable_type, attendable_id, user_id, status, method, visitor_type, checked_in_at)
       VALUES (:id, :attendableId, :attendableType, :attendableId, :userId, :status, :method, :visitorType, NOW())
       ON DUPLICATE KEY UPDATE status = :status, method = :method, checked_in_at = NOW()`,
      { id, ...data }
    );
    const rows = await query<AttendanceRecord[]>(
      `SELECT * FROM attendance_records WHERE (attendable_id = :attendableId OR session_id = :attendableId) AND user_id = :userId`,
      { attendableId: data.attendableId, userId: data.userId }
    );
    return rows[0] || { id, ...data, checked_in_at: new Date().toISOString() };
  }
}

