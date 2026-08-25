import { BaseRepository } from '../../../core/base.repository';
import { BibleStudyGroups } from '../interfaces/bible-study-groups.interface';

export class BibleStudyGroupsRepository extends BaseRepository<BibleStudyGroups> {
  constructor() {
    super('bible_study_groups');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
