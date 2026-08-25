import { BaseService } from '../../../core/base.service';
import { NotFoundError, BusinessRuleError } from '../../../utils/errors';
import { query } from '../../../config/database';
import { Ministries } from '../interfaces/ministries.interface';
import { MinistriesRepository } from '../repositories/ministries.repository';

export class MinistriesService extends BaseService<Ministries> {
  constructor(protected readonly repository: MinistriesRepository = new MinistriesRepository()) {
    super(repository);
  }

  async getDetails(id: string) {
    const ministry = await this.repository.findById(id);
    const [memberRows, trainingRows] = await Promise.all([
      query<{ total: number }[]>(
        `SELECT COUNT(*) AS total\n           FROM ministry_members mm\n           JOIN memberships m ON m.user_id = mm.user_id\n          WHERE mm.ministry_id = :ministryId\n            AND (mm.end_date IS NULL OR mm.end_date >= CURDATE())\n            AND m.status = 'active'`,
        { ministryId: id }
      ),
      query<{ id: string; title: string; training_date: string; facilitator: string | null; notes: string | null }[]>(
        `SELECT id, title, training_date, facilitator, notes\n           FROM ministry_trainings\n          WHERE ministry_id = :ministryId\n          ORDER BY training_date DESC\n          LIMIT 6`,
        { ministryId: id }
      ),
    ]);

    return {
      ministry,
      stats: { activeMembers: Number(memberRows[0]?.total ?? 0) },
      trainings: trainingRows,
    };
  }

  async findByIdSafe(id: string) {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw error;
    }
  }
}
