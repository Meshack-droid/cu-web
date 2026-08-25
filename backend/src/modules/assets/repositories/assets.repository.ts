import { BaseRepository } from '../../../core/base.repository';
import { Assets } from '../interfaces/assets.interface';

export class AssetsRepository extends BaseRepository<Assets> {
  constructor() {
    super('assets');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
