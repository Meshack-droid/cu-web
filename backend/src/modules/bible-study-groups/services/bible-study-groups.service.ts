import { BaseService } from '../../../core/base.service';
import { BibleStudyGroups } from '../interfaces/bible-study-groups.interface';
import { BibleStudyGroupsRepository } from '../repositories/bible-study-groups.repository';

export class BibleStudyGroupsService extends BaseService<BibleStudyGroups> {
  constructor(repository: BibleStudyGroupsRepository = new BibleStudyGroupsRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
