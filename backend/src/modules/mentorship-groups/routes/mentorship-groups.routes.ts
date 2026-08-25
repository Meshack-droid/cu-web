import { Router } from 'express';
import { mentorshipGroupsController } from '../controllers/mentorship-groups.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('discipleship.view'), mentorshipGroupsController.list);
router.get('/:id', requirePermission('discipleship.view'), mentorshipGroupsController.getById);
router.post('/', requirePermission('discipleship.create'), mentorshipGroupsController.create);
router.put('/:id', requirePermission('discipleship.edit'), mentorshipGroupsController.update);
router.delete('/:id', requirePermission('discipleship.delete'), mentorshipGroupsController.remove);

export default router;
