import { Router } from 'express';
import { committeeMembersController } from '../controllers/committee-members.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('committees.view'), committeeMembersController.list);
router.get('/:id', requirePermission('committees.view'), committeeMembersController.getById);
router.post('/', requirePermission('committees.create'), committeeMembersController.create);
router.put('/:id', requirePermission('committees.edit'), committeeMembersController.update);
router.delete('/:id', requirePermission('committees.delete'), committeeMembersController.remove);

export default router;
