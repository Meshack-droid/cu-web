import { BaseController } from '../../../core/base.controller';
import { AuditLogs } from '../interfaces/audit-logs.interface';
import { AuditLogsService } from '../services/audit-logs.service';

export const auditLogsController = new BaseController<AuditLogs>(new AuditLogsService(), 'AuditLogs');
