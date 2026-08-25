import { BaseRepository } from '../../../core/base.repository';
import { Ministries } from '../interfaces/ministries.interface';

export class MinistriesRepository extends BaseRepository<Ministries> {
  constructor() {
    super('ministries');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
