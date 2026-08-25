import { BaseService } from '../../../core/base.service';
import { Leadership } from '../interfaces/leadership.interface';
import { LeadershipRepository } from '../repositories/leadership.repository';

export class LeadershipService extends BaseService<Leadership> {
  constructor(repository: LeadershipRepository = new LeadershipRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
