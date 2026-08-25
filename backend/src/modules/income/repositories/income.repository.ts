import { BaseRepository } from '../../../core/base.repository';
import { Income } from '../interfaces/income.interface';

export class IncomeRepository extends BaseRepository<Income> {
  constructor() {
    super('income_records');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
