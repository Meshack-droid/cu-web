import { BaseRepository } from '../../../core/base.repository';
import { ExpenseRequest } from '../interfaces/expenses.interface';

export class ExpensesRepository extends BaseRepository<ExpenseRequest> {
  constructor() {
    super('expense_requests');
  }
}
