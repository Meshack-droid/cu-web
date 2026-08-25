import { BaseController } from '../../../core/base.controller';
import { BroadcastMessages } from '../interfaces/broadcast-messages.interface';
import { BroadcastMessagesService } from '../services/broadcast-messages.service';

export const broadcastMessagesController = new BaseController<BroadcastMessages>(new BroadcastMessagesService(), 'BroadcastMessages');
