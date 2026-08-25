import { Router } from 'express';
import { bibleStudyGroupsController } from '../controllers/bible-study-groups.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('discipleship.view'), bibleStudyGroupsController.list);
router.get('/:id', requirePermission('discipleship.view'), bibleStudyGroupsController.getById);
router.post('/', requirePermission('discipleship.create'), bibleStudyGroupsController.create);
router.put('/:id', requirePermission('discipleship.edit'), bibleStudyGroupsController.update);
router.delete('/:id', requirePermission('discipleship.delete'), bibleStudyGroupsController.remove);

export default router;
