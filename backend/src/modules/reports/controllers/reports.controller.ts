import { BaseController } from '../../../core/base.controller';
import { Reports } from '../interfaces/reports.interface';
import { ReportsService } from '../services/reports.service';

export const reportsController = new BaseController<Reports>(new ReportsService(), 'Reports');
