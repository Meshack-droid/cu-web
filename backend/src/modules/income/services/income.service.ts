import { BaseService } from '../../../core/base.service';
import { Income } from '../interfaces/income.interface';
import { IncomeRepository } from '../repositories/income.repository';

export class IncomeService extends BaseService<Income> {
  constructor(repository: IncomeRepository = new IncomeRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
