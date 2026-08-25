import { Router } from 'express';
import { assetsController } from '../controllers/assets.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('assets.view'), assetsController.list);
router.get('/:id', requirePermission('assets.view'), assetsController.getById);
router.post('/', requirePermission('assets.create'), assetsController.create);
router.put('/:id', requirePermission('assets.edit'), assetsController.update);
router.delete('/:id', requirePermission('assets.delete'), assetsController.remove);

export default router;
