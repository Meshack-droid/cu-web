import { BaseService } from '../../../core/base.service';
import { Assets } from '../interfaces/assets.interface';
import { AssetsRepository } from '../repositories/assets.repository';

export class AssetsService extends BaseService<Assets> {
  constructor(repository: AssetsRepository = new AssetsRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
