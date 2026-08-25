import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query } from '../../../config/database';
import { BaseRepository } from '../../../core/base.repository';
import { Event, EventRegistration } from '../interfaces/events.interface';

export class EventsRepository extends BaseRepository<Event> {
  constructor() {
    super('events');
  }

  /**
   * Public site listing — deliberately excludes 'draft' and 'budgeted'
   * events (internal planning stages not yet approved for public view),
   * regardless of any filter the caller passes, since this method backs
   * an unauthenticated route.
   */
  async listPublic(page: number, pageSize: number) {
    // Public traffic can be large. Keep the query bounded and avoid SELECT *
    // so a future/internal column cannot accidentally become public.
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize)
      ? Math.min(Math.max(Math.floor(pageSize), 1), 50)
      : 20;
    const offset = (safePage - 1) * safePageSize;

    // Older local databases may have the base `events` table but not yet have
    // the operational event columns from migration 002. Detect that state
    // explicitly so the public page fails gracefully instead of returning a
    // generic SQL/500 error. The migration below will still bring production
    // databases to the full schema.
    const columnRows = await query<{ column_name: string }[]>(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'events'
          AND column_name IN ('status', 'capacity', 'registration_deadline')`
    );
    const columns = new Set(columnRows.map((row) => row.column_name));
    const hasStatus = columns.has('status');
    const hasCapacity = columns.has('capacity');
    const hasRegistrationDeadline = columns.has('registration_deadline');

    const statusWhere = hasStatus
      ? `status IN ('approved', 'registration_open', 'ongoing')
         AND (start_at >= NOW() OR (end_at IS NOT NULL AND end_at >= NOW()))`
      : `start_at >= NOW()`;

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total
         FROM events
        WHERE ${statusWhere}`
    );
    const total = Number(countRows[0]?.total ?? 0);

    const rows = await query<Event[]>(
      `SELECT
          id,
          title,
          event_type,
          description,
          start_at,
          end_at,
          location,
          organized_by,
          ${hasStatus ? 'status' : "'approved' AS status"},
          ${hasCapacity ? 'capacity' : 'NULL AS capacity'},
          ${hasRegistrationDeadline ? 'registration_deadline' : 'NULL AS registration_deadline'},
          created_at
       FROM events
       WHERE ${statusWhere}
       ORDER BY start_at ASC
       LIMIT :limit OFFSET :offset`,
      { limit: safePageSize, offset }
    );

    return {
      rows,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    };
  }
}

export class EventRegistrationsRepository {
  async countByStatus(eventId: string, status: EventRegistration['status']): Promise<number> {
    const rows = await query<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM event_registrations WHERE event_id = :eventId AND status = :status`,
      { eventId, status }
    );
    return rows[0]?.count ?? 0;
  }

  async listForEvent(eventId: string): Promise<EventRegistration[]> {
    return query<EventRegistration[]>(`SELECT * FROM event_registrations WHERE event_id = :eventId`, {
      eventId,
    });
  }

  async findByQrCode(qrCode: string): Promise<EventRegistration | null> {
    const rows = await query<EventRegistration[]>(
      `SELECT * FROM event_registrations WHERE qr_code = :qrCode LIMIT 1`,
      { qrCode }
    );
    return rows[0] ?? null;
  }

  async create(data: {
    eventId: string;
    userId?: string | null;
    walkInName?: string | null;
    registrationType: 'online' | 'walk_in';
    status: EventRegistration['status'];
  }): Promise<EventRegistration> {
    const id = uuidv4();
    const qrCode = data.status === 'registered' ? crypto.randomBytes(16).toString('hex') : null;

    await query(
      `INSERT INTO event_registrations (id, event_id, user_id, walk_in_name, registration_type, status, qr_code)
       VALUES (:id, :eventId, :userId, :walkInName, :registrationType, :status, :qrCode)`,
      {
        id,
        eventId: data.eventId,
        userId: data.userId ?? null,
        walkInName: data.walkInName ?? null,
        registrationType: data.registrationType,
        status: data.status,
        qrCode,
      }
    );

    const rows = await query<EventRegistration[]>(`SELECT * FROM event_registrations WHERE id = :id`, { id });
    return rows[0];
  }

  async markAttended(registrationId: string): Promise<void> {
    await query(`UPDATE event_registrations SET status = 'attended' WHERE id = :registrationId`, {
      registrationId,
    });
  }

  async cancel(registrationId: string): Promise<void> {
    await query(`UPDATE event_registrations SET status = 'cancelled' WHERE id = :registrationId`, {
      registrationId,
    });
  }
}
