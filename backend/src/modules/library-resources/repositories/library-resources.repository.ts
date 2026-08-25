import { BaseRepository } from '../../../core/base.repository';
import { LibraryResources } from '../interfaces/library-resources.interface';

export class LibraryResourcesRepository extends BaseRepository<LibraryResources> {
  constructor() {
    super('library_resources');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
