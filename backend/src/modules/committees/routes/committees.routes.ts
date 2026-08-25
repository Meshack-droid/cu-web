import { Router } from 'express';
import { committeesController } from '../controllers/committees.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('committees.view'), committeesController.list);
router.get('/:id', requirePermission('committees.view'), committeesController.getById);
router.post('/', requirePermission('committees.create'), committeesController.create);
router.put('/:id', requirePermission('committees.edit'), committeesController.update);
router.delete('/:id', requirePermission('committees.delete'), committeesController.remove);

export default router;
