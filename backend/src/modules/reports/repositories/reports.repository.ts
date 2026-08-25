import { BaseRepository } from '../../../core/base.repository';
import { Reports } from '../interfaces/reports.interface';

export class ReportsRepository extends BaseRepository<Reports> {
  constructor() {
    super('generated_reports');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
