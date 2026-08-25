import { BaseController } from '../../../core/base.controller';
import { Leadership } from '../interfaces/leadership.interface';
import { LeadershipService } from '../services/leadership.service';

export const leadershipController = new BaseController<Leadership>(new LeadershipService(), 'Leadership');
