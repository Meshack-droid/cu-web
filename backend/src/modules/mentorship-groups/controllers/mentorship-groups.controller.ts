import { BaseController } from '../../../core/base.controller';
import { MentorshipGroups } from '../interfaces/mentorship-groups.interface';
import { MentorshipGroupsService } from '../services/mentorship-groups.service';

export const mentorshipGroupsController = new BaseController<MentorshipGroups>(new MentorshipGroupsService(), 'MentorshipGroups');
