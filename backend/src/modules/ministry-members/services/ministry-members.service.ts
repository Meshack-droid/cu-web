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

  async joinMinistry(userId: string, ministryIdOrCode: string) {
    const [membershipRows, ministryRows, yearRows] = await Promise.all([
      query<{ id: string }[]>(
        `SELECT id FROM memberships WHERE user_id = :userId AND status = 'active' ORDER BY registration_date DESC LIMIT 1`,
        { userId }
      ),
      query<{ id: string; code: string }[]>(
        `SELECT id, code FROM ministries WHERE id = :ministryId OR code = :ministryId LIMIT 1`,
        { ministryId: ministryIdOrCode, idOrCode: ministryIdOrCode }
      ),
      query<{ id: string }[]>(`SELECT id FROM spiritual_years WHERE is_current = TRUE LIMIT 1`, {}),
    ]);

    if (!membershipRows[0]) throw new BusinessRuleError('Only admitted active members can join a ministry');
    if (!ministryRows[0]) throw new NotFoundError('Ministry');
    if (!yearRows[0]) throw new NotFoundError('Current spiritual year');

    const ministryId = ministryRows[0].id;
    const existing = await query<{ id: string; position: string }[]>(
      `SELECT id, position FROM ministry_members
        WHERE (ministry_id = :ministryId OR ministry_id = :rawId) AND user_id = :userId AND spiritual_year_id = :yearId
          AND (end_date IS NULL OR end_date >= CURDATE())
        LIMIT 1`,
      { ministryId, rawId: ministryIdOrCode, userId, yearId: yearRows[0].id }
    );
    if (existing[0]) return { joined: true, membership: existing[0] };

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO ministry_members (id, ministry_id, user_id, position, spiritual_year_id, start_date)
       VALUES (:id, :ministryId, :userId, 'member', :yearId, CURDATE())`,
      { id, ministryId, userId, yearId: yearRows[0].id }
    );
    return { joined: true, membership: { id, position: 'member' } };
  }

  async leaveMinistry(userId: string, ministryIdOrCode: string) {
    const ministryRows = await query<{ id: string }[]>(
      `SELECT id FROM ministries WHERE id = :ministryId OR code = :ministryId LIMIT 1`,
      { ministryId: ministryIdOrCode }
    );
    const resolvedMinId = ministryRows[0]?.id || ministryIdOrCode;

    const rows = await query<{ id: string; position: string }[]>(
      `SELECT id, position FROM ministry_members
        WHERE (ministry_id = :ministryId OR ministry_id = :rawId) AND user_id = :userId
          AND (end_date IS NULL OR end_date >= CURDATE()) LIMIT 1`,
      { ministryId: resolvedMinId, rawId: ministryIdOrCode, userId }
    );
    const record = rows[0];
    if (!record) throw new NotFoundError('Ministry membership');
    if (record.position !== 'member') throw new BusinessRuleError('Ministry leaders and deputies must be reassigned before leaving a ministry');

    await query(`UPDATE ministry_members SET end_date = CURDATE() WHERE id = :id`, { id: record.id });
    return { left: true };
  }

  async myMembership(userId: string, ministryIdOrCode: string) {
    const ministryRows = await query<{ id: string }[]>(
      `SELECT id FROM ministries WHERE id = :ministryId OR code = :ministryId LIMIT 1`,
      { ministryId: ministryIdOrCode }
    );
    const resolvedMinId = ministryRows[0]?.id || ministryIdOrCode;

    const rows = await query<{ id: string; ministry_id: string; position: string; start_date: string; end_date: string | null }[]>(
      `SELECT id, ministry_id, position, start_date, end_date
         FROM ministry_members
        WHERE user_id = :userId AND (ministry_id = :ministryId OR ministry_id = :rawId)
          AND (end_date IS NULL OR end_date >= CURDATE())
        ORDER BY start_date DESC LIMIT 1`,
      { userId, ministryId: resolvedMinId, rawId: ministryIdOrCode }
    );
    return rows[0] ?? null;
  }

  async listMyMinistries(userId: string) {
    const membershipRows = await query<any[]>(
      `SELECT id, ministry_id, position, start_date, end_date
         FROM ministry_members
        WHERE user_id = :userId
          AND (end_date IS NULL OR end_date >= CURDATE())
        ORDER BY start_date DESC`,
      { userId }
    );
    const rows = Array.isArray(membershipRows) ? membershipRows : [];
    if (rows.length === 0) return [];

    const ministryRows = await query<any[]>(`SELECT id, code, name, description FROM ministries`, {});
    const allMinistries = Array.isArray(ministryRows) ? ministryRows : [];

    return rows.map((mm) => {
      const min = allMinistries.find((m) => m.id === mm.ministry_id || m.code === mm.ministry_id);
      return {
        id: mm.id,
        ministry_id: mm.ministry_id,
        ministry_name: min ? min.name : 'TUMCU Ministry',
        ministry_code: min ? min.code : '',
        description: min ? min.description : '',
        position: mm.position || 'member',
        start_date: mm.start_date,
      };
    });
  }
}
