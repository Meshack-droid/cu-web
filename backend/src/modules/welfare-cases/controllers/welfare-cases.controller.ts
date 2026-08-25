import { BaseController } from '../../../core/base.controller';
import { WelfareCases } from '../interfaces/welfare-cases.interface';
import { WelfareCasesService } from '../services/welfare-cases.service';

export const welfareCasesController = new BaseController<WelfareCases>(new WelfareCasesService(), 'WelfareCases');
