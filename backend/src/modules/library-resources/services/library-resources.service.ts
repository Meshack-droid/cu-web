import { BaseService } from '../../../core/base.service';
import { LibraryResources } from '../interfaces/library-resources.interface';
import { LibraryResourcesRepository } from '../repositories/library-resources.repository';

export class LibraryResourcesService extends BaseService<LibraryResources> {
  constructor(repository: LibraryResourcesRepository = new LibraryResourcesRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
