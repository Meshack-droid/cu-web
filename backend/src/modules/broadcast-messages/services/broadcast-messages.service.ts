import { BaseService } from '../../../core/base.service';
import { BroadcastMessages } from '../interfaces/broadcast-messages.interface';
import { BroadcastMessagesRepository } from '../repositories/broadcast-messages.repository';

export class BroadcastMessagesService extends BaseService<BroadcastMessages> {
  constructor(repository: BroadcastMessagesRepository = new BroadcastMessagesRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
