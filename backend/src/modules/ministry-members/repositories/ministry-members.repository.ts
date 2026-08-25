import { BaseRepository } from '../../../core/base.repository';
import { query } from '../../../config/database';
import { MinistryMember } from '../interfaces/ministry-members.interface';

export class MinistryMembersRepository extends BaseRepository<MinistryMember> {
  constructor() {
    super('ministry_members');
  }

  /** Needed by enforceScope: which ministry does an existing roster row belong to? */
  async findMinistryIdForRecord(id: string): Promise<string | null> {
    const rows = await query<{ ministry_id: string }[]>(
      `SELECT ministry_id FROM ministry_members WHERE id = :id`,
      { id }
    );
    return rows[0]?.ministry_id ?? null;
  }
}
