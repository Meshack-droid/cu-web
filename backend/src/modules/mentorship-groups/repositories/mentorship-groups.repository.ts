import { BaseRepository } from '../../../core/base.repository';
import { MentorshipGroups } from '../interfaces/mentorship-groups.interface';

export class MentorshipGroupsRepository extends BaseRepository<MentorshipGroups> {
  constructor() {
    super('mentorship_groups');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
