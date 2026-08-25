import { BaseService } from '../../../core/base.service';
import { WelfareCases } from '../interfaces/welfare-cases.interface';
import { WelfareCasesRepository } from '../repositories/welfare-cases.repository';

export class WelfareCasesService extends BaseService<WelfareCases> {
  constructor(repository: WelfareCasesRepository = new WelfareCasesRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
