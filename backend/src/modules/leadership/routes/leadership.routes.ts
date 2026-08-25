import { Router } from 'express';
import { leadershipController } from '../controllers/leadership.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('leadership.view'), leadershipController.list);
router.get('/:id', requirePermission('leadership.view'), leadershipController.getById);
router.post('/', requirePermission('leadership.create'), leadershipController.create);
router.put('/:id', requirePermission('leadership.edit'), leadershipController.update);
router.delete('/:id', requirePermission('leadership.delete'), leadershipController.remove);

export default router;
