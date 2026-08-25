import { BaseRepository } from '../../../core/base.repository';
import { EvangelismTeams } from '../interfaces/evangelism-teams.interface';

export class EvangelismTeamsRepository extends BaseRepository<EvangelismTeams> {
  constructor() {
    super('evangelism_teams');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
