import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';
import { BaseRepository } from '../../../core/base.repository';
import { AttendanceRecord } from '../interfaces/attendance.interface';

export class AttendanceRepository extends BaseRepository<AttendanceRecord> {
  constructor() {
    super('attendance_records');
  }

  /**
   * Self-service: a member's own attendance history across every
   * attendable type. Meetings are tracked in a separate table
   * (meeting_attendance_confirmations — it carries meeting-specific fields
   * like arrival_status and is_guest_speaker that don't apply anywhere
   * else) rather than in attendance_records, so this UNIONs both rather
   * than silently showing only half a member's history.
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

  /** Upserts so re-marking the same person for the same session updates rather than duplicates (matches the unique key on the table). */
  async recordAttendance(data: {
    attendableType: string;
    attendableId: string;
    userId: string;
    status: string;
    method: string;
    visitorType: string;
  }) {
    const id = uuidv4();
    await query(
      `INSERT INTO attendance_records (id, attendable_type, attendable_id, user_id, status, method, visitor_type, checked_in_at)
       VALUES (:id, :attendableType, :attendableId, :userId, :status, :method, :visitorType, NOW())
       ON DUPLICATE KEY UPDATE status = :status, method = :method, checked_in_at = NOW()`,
      { id, ...data }
    );
    const rows = await query<AttendanceRecord[]>(
      `SELECT * FROM attendance_records WHERE attendable_type = :attendableType AND attendable_id = :attendableId AND user_id = :userId`,
      { attendableType: data.attendableType, attendableId: data.attendableId, userId: data.userId }
    );
    return rows[0];
  }
}
