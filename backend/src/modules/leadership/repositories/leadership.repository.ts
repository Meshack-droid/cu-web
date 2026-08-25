import { BaseRepository } from '../../../core/base.repository';
import { Leadership } from '../interfaces/leadership.interface';

export class LeadershipRepository extends BaseRepository<Leadership> {
  constructor() {
    super('executive_terms');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
