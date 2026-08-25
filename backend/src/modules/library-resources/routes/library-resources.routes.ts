import { Router } from 'express';
import { libraryResourcesController } from '../controllers/library-resources.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('library.view'), libraryResourcesController.list);
router.get('/:id', requirePermission('library.view'), libraryResourcesController.getById);
router.post('/', requirePermission('library.create'), libraryResourcesController.create);
router.put('/:id', requirePermission('library.edit'), libraryResourcesController.update);
router.delete('/:id', requirePermission('library.delete'), libraryResourcesController.remove);

export default router;
