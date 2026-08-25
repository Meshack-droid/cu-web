import { BaseRepository } from '../../../core/base.repository';
import { BroadcastMessages } from '../interfaces/broadcast-messages.interface';

export class BroadcastMessagesRepository extends BaseRepository<BroadcastMessages> {
  constructor() {
    super('broadcast_messages');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
