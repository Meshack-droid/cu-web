import { BaseRepository } from '../../../core/base.repository';
import { AuditLogs } from '../interfaces/audit-logs.interface';

export class AuditLogsRepository extends BaseRepository<AuditLogs> {
  constructor() {
    super('audit_logs');
  }
  // Add bespoke queries here as the module's real requirements grow.
}
