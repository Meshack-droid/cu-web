import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('reports.view'), reportsController.list);
router.get('/:id', requirePermission('reports.view'), reportsController.getById);
router.post('/', requirePermission('reports.create'), reportsController.create);
router.put('/:id', requirePermission('reports.edit'), reportsController.update);
router.delete('/:id', requirePermission('reports.delete'), reportsController.remove);

export default router;
