import { BaseRepository } from '../../../core/base.repository';
import { Committees } from '../interfaces/committees.interface';

export class CommitteesRepository extends BaseRepository<Committees> {
  constructor() {
    super('committees');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
