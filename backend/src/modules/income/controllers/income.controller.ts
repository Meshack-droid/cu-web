import { BaseController } from '../../../core/base.controller';
import { Income } from '../interfaces/income.interface';
import { IncomeService } from '../services/income.service';

export const incomeController = new BaseController<Income>(new IncomeService(), 'Income');
