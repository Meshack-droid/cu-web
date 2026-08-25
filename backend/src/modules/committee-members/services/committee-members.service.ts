import { BaseService } from '../../../core/base.service';
import { CommitteeMembers } from '../interfaces/committee-members.interface';
import { CommitteeMembersRepository } from '../repositories/committee-members.repository';

export class CommitteeMembersService extends BaseService<CommitteeMembers> {
  constructor(repository: CommitteeMembersRepository = new CommitteeMembersRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
