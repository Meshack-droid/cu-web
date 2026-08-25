import { BaseService } from '../../../core/base.service';
import { EvangelismTeams } from '../interfaces/evangelism-teams.interface';
import { EvangelismTeamsRepository } from '../repositories/evangelism-teams.repository';

export class EvangelismTeamsService extends BaseService<EvangelismTeams> {
  constructor(repository: EvangelismTeamsRepository = new EvangelismTeamsRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
