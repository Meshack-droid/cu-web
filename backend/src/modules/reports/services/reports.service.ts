import { BaseService } from '../../../core/base.service';
import { Reports } from '../interfaces/reports.interface';
import { ReportsRepository } from '../repositories/reports.repository';

export class ReportsService extends BaseService<Reports> {
  constructor(repository: ReportsRepository = new ReportsRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
