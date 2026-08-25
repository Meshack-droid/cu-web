import { BaseService } from '../../../core/base.service';
import { BusinessRuleError, NotFoundError } from '../../../utils/errors';
import { query } from '../../../config/database';
import crypto from 'crypto';
import { MinistryMember } from '../interfaces/ministry-members.interface';
import { MinistryMembersRepository } from '../repositories/ministry-members.repository';

export class MinistryMembersService extends BaseService<MinistryMember> {
  constructor(private readonly ministryMembersRepository: MinistryMembersRepository = new MinistryMembersRepository()) {
    super(ministryMembersRepository);
  }

  findMinistryIdForRecord(id: string) {
    return this.ministryMembersRepository.findMinistryIdForRecord(id);
  }

  async joinMinistry(userId: string, ministryId: string) {
    const [membershipRows, ministryRows, yearRows] = await Promise.all([
      query<{ id: string }[]>(
        `SELECT id FROM memberships WHERE user_id = :userId AND status = 'active' ORDER BY registration_date DESC LIMIT 1`,
        { userId }
      ),
      query<{ id: string }[]>(`SELECT id FROM ministries WHERE id = :ministryId LIMIT 1`, { ministryId }),
      query<{ id: string }[]>(`SELECT id FROM spiritual_years WHERE is_current = TRUE LIMIT 1`, {}),
    ]);

    if (!membershipRows[0]) throw new BusinessRuleError('Only admitted active members can join a ministry');
    if (!ministryRows[0]) throw new NotFoundError('Ministry');
    if (!yearRows[0]) throw new NotFoundError('Current spiritual year');

    const existing = await query<{ id: string; position: string }[]>(
      `SELECT id, position FROM ministry_members\n        WHERE ministry_id = :ministryId AND user_id = :userId AND spiritual_year_id = :yearId\n          AND (end_date IS NULL OR end_date >= CURDATE())\n        LIMIT 1`,
      { ministryId, userId, yearId: yearRows[0].id }
    );
    if (existing[0]) return { joined: true, membership: existing[0] };

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO ministry_members (id, ministry_id, user_id, position, spiritual_year_id, start_date)\n       VALUES (:id, :ministryId, :userId, 'member', :yearId, CURDATE())`,
      { id, ministryId, userId, yearId: yearRows[0].id }
    );
    return { joined: true, membership: { id, position: 'member' } };
  }

  async leaveMinistry(userId: string, ministryId: string) {
    const rows = await query<{ id: string; position: string }[]>(
      `SELECT id, position FROM ministry_members\n        WHERE ministry_id = :ministryId AND user_id = :userId\n          AND (end_date IS NULL OR end_date >= CURDATE()) LIMIT 1`,
      { ministryId, userId }
    );
    const record = rows[0];
    if (!record) throw new NotFoundError('Ministry membership');
    if (record.position !== 'member') throw new BusinessRuleError('Ministry leaders and deputies must be reassigned before leaving a ministry');

    await query(`UPDATE ministry_members SET end_date = CURDATE() WHERE id = :id`, { id: record.id });
    return { left: true };
  }

  async myMembership(userId: string, ministryId: string) {
    const rows = await query<{ id: string; ministry_id: string; position: string; start_date: string; end_date: string | null }[]>(
      `SELECT id, ministry_id, position, start_date, end_date\n         FROM ministry_members\n        WHERE user_id = :userId AND ministry_id = :ministryId\n          AND (end_date IS NULL OR end_date >= CURDATE())\n        ORDER BY start_date DESC LIMIT 1`,
      { userId, ministryId }
    );
    return rows[0] ?? null;
  }
}
