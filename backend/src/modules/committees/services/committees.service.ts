import { BaseService } from '../../../core/base.service';
import { Committees } from '../interfaces/committees.interface';
import { CommitteesRepository } from '../repositories/committees.repository';

export class CommitteesService extends BaseService<Committees> {
  constructor(repository: CommitteesRepository = new CommitteesRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
