import { BaseRepository } from '../../../core/base.repository';
import { Ministries } from '../interfaces/ministries.interface';
import { query } from '../../../config/database';
import { NotFoundError } from '../../../utils/errors';

export class MinistriesRepository extends BaseRepository<Ministries> {
  constructor() {
    super('ministries');
  }

  async findByIdOrCode(idOrCode: string): Promise<Ministries> {
    const rows = await query<Ministries[]>(
      `SELECT * FROM ministries WHERE id = :idOrCode OR code = :idOrCode LIMIT 1`,
      { idOrCode }
    );
    let record = rows[0];
    if (!record && idOrCode.startsWith('directory-')) {
      const idx = parseInt(idOrCode.replace('directory-', ''), 10);
      const allRows = await query<Ministries[]>(`SELECT * FROM ministries ORDER BY created_at ASC`);
      if (allRows[idx]) record = allRows[idx];
    }
    if (!record) {
      throw new NotFoundError('Ministry');
    }
    return record;
  }

  override async update(idOrCode: string, data: Partial<Ministries>): Promise<Ministries> {
    const existing = await this.findByIdOrCode(idOrCode);
    return super.update(existing.id, data);
  }
}

