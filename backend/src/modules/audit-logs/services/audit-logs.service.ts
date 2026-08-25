import { BaseService } from '../../../core/base.service';
import { AuditLogs } from '../interfaces/audit-logs.interface';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';

export class AuditLogsService extends BaseService<AuditLogs> {
  constructor(repository: AuditLogsRepository = new AuditLogsRepository()) {
    super(repository);
  }
  // Override list/create/update/remove here once this module needs business rules
  // beyond plain CRUD (approval workflows, notifications, cross-table writes, etc).
}
