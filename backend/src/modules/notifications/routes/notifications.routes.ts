import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller';
import { authenticate, loadPermissions } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', notificationsController.list);
router.get('/unread-count', notificationsController.unreadCount);
router.post('/:id/read', notificationsController.markRead);

export default router;
