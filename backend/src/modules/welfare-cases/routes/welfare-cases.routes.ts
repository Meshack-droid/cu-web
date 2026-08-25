import { Router } from 'express';
import { welfareCasesController } from '../controllers/welfare-cases.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('welfare.view'), welfareCasesController.list);
router.get('/:id', requirePermission('welfare.view'), welfareCasesController.getById);
router.post('/', requirePermission('welfare.create'), welfareCasesController.create);
router.put('/:id', requirePermission('welfare.edit'), welfareCasesController.update);
router.delete('/:id', requirePermission('welfare.delete'), welfareCasesController.remove);

export default router;
