import { BaseController } from '../../../core/base.controller';
import { Committees } from '../interfaces/committees.interface';
import { CommitteesService } from '../services/committees.service';

export const committeesController = new BaseController<Committees>(new CommitteesService(), 'Committees');
