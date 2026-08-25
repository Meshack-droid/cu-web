import { Router } from 'express';
import { evangelismTeamsController } from '../controllers/evangelism-teams.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('evangelism.view'), evangelismTeamsController.list);
router.get('/:id', requirePermission('evangelism.view'), evangelismTeamsController.getById);
router.post('/', requirePermission('evangelism.create'), evangelismTeamsController.create);
router.put('/:id', requirePermission('evangelism.edit'), evangelismTeamsController.update);
router.delete('/:id', requirePermission('evangelism.delete'), evangelismTeamsController.remove);

export default router;
