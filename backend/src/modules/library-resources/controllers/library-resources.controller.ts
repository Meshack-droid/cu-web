import { BaseController } from '../../../core/base.controller';
import { LibraryResources } from '../interfaces/library-resources.interface';
import { LibraryResourcesService } from '../services/library-resources.service';

export const libraryResourcesController = new BaseController<LibraryResources>(new LibraryResourcesService(), 'LibraryResources');
