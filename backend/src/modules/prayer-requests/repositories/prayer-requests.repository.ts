import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';
import { NotFoundError } from '../../../utils/errors';
import { PrayerRequest } from '../interfaces/prayer-requests.interface';

export class PrayerRequestsRepository {
  /**
   * Privacy is enforced here, not left to the controller/service to
   * remember — every caller of this method gets a correctly-filtered list,
   * never "everything" by accident. A caller always sees:
   *   - every 'public' request
   *   - their OWN requests, regardless of privacy level
   *   - (if canViewConfidential) 'prayer_team' / 'executive_only' / 'private' too
   */
  async listVisibleTo(userId: string, canViewConfidential: boolean, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const visibilityClause = canViewConfidential
      ? '1=1'
      : `(privacy_level = 'public' OR requested_by = :userId)`;

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM prayer_requests WHERE ${visibilityClause}`,
      { userId }
    );
    const total = countRows[0]?.total ?? 0;

    const rows = await query<PrayerRequest[]>(
      `SELECT * FROM prayer_requests
        WHERE ${visibilityClause}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset`,
      { userId, limit: pageSize, offset }
    );

    return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  async findByIdVisibleTo(id: string, userId: string, canViewConfidential: boolean): Promise<PrayerRequest> {
    const rows = await query<PrayerRequest[]>(`SELECT * FROM prayer_requests WHERE id = :id`, { id });
    const record = rows[0];
    if (!record) throw new NotFoundError('Prayer request');

    const visible = canViewConfidential || record.privacy_level === 'public' || record.requested_by === userId;
    if (!visible) throw new NotFoundError('Prayer request'); // 404, not 403 — don't confirm a private request exists

    return record;
  }

  async create(data: {
    requestedBy: string | null;
    title: string;
    details: string;
    privacyLevel: string;
  }): Promise<PrayerRequest> {
    const id = uuidv4();
    await query(
      `INSERT INTO prayer_requests (id, requested_by, title, details, privacy_level, status)
       VALUES (:id, :requestedBy, :title, :details, :privacyLevel, 'open')`,
      { id, ...data }
    );
    const rows = await query<PrayerRequest[]>(`SELECT * FROM prayer_requests WHERE id = :id`, { id });
    return rows[0];
  }

  /** Only the original requester or confidential-tier staff may update status/content. */
  async updateIfAllowed(
    id: string,
    userId: string,
    canViewConfidential: boolean,
    data: Partial<Pick<PrayerRequest, 'status' | 'title' | 'details' | 'privacy_level'>>
  ): Promise<PrayerRequest> {
    const existing = await this.findByIdVisibleTo(id, userId, canViewConfidential);
    const isOwner = existing.requested_by === userId;
    if (!isOwner && !canViewConfidential) {
      throw new NotFoundError('Prayer request');
    }

    const entries = Object.entries(data);
    if (entries.length > 0) {
      const setClause = entries.map(([k]) => `${k} = :${k}`).join(', ');
      await query(`UPDATE prayer_requests SET ${setClause} WHERE id = :id`, {
        ...Object.fromEntries(entries),
        id,
      });
    }

    const rows = await query<PrayerRequest[]>(`SELECT * FROM prayer_requests WHERE id = :id`, { id });
    return rows[0];
  }
}
