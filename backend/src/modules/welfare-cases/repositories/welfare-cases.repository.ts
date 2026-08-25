import { BaseRepository } from '../../../core/base.repository';
import { WelfareCases } from '../interfaces/welfare-cases.interface';

export class WelfareCasesRepository extends BaseRepository<WelfareCases> {
  constructor() {
    super('welfare_cases');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
