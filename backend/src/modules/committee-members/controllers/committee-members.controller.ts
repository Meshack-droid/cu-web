import { BaseController } from '../../../core/base.controller';
import { CommitteeMembers } from '../interfaces/committee-members.interface';
import { CommitteeMembersService } from '../services/committee-members.service';

export const committeeMembersController = new BaseController<CommitteeMembers>(new CommitteeMembersService(), 'CommitteeMembers');
