import { BaseRepository } from '../../../core/base.repository';
import { CommitteeMembers } from '../interfaces/committee-members.interface';

export class CommitteeMembersRepository extends BaseRepository<CommitteeMembers> {
  constructor() {
    super('committee_members');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
