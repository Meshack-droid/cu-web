import { BaseController } from '../../../core/base.controller';
import { BibleStudyGroups } from '../interfaces/bible-study-groups.interface';
import { BibleStudyGroupsService } from '../services/bible-study-groups.service';

export const bibleStudyGroupsController = new BaseController<BibleStudyGroups>(new BibleStudyGroupsService(), 'BibleStudyGroups');
