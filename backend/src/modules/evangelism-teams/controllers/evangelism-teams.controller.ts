import { BaseController } from '../../../core/base.controller';
import { EvangelismTeams } from '../interfaces/evangelism-teams.interface';
import { EvangelismTeamsService } from '../services/evangelism-teams.service';

export const evangelismTeamsController = new BaseController<EvangelismTeams>(new EvangelismTeamsService(), 'EvangelismTeams');
