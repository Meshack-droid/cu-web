import { Router } from 'express';
import { auditLogsController } from '../controllers/audit-logs.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('audit.view'), auditLogsController.list);
router.get('/:id', requirePermission('audit.view'), auditLogsController.getById);

export default router;
