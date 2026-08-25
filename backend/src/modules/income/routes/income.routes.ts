import { Router } from 'express';
import { incomeController } from '../controllers/income.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('finance.view'), incomeController.list);
router.get('/:id', requirePermission('finance.view'), incomeController.getById);
router.post('/', requirePermission('finance.create'), incomeController.create);
router.put('/:id', requirePermission('finance.edit'), incomeController.update);
router.delete('/:id', requirePermission('finance.delete'), incomeController.remove);

export default router;
