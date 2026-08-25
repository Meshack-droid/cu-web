import { BaseService } from '../../../core/base.service';
import { MentorshipGroups } from '../interfaces/mentorship-groups.interface';
import { MentorshipGroupsRepository } from '../repositories/mentorship-groups.repository';

export class MentorshipGroupsService extends BaseService<MentorshipGroups> {
  constructor(repository: MentorshipGroupsRepository = new MentorshipGroupsRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
