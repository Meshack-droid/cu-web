import { Router } from 'express';
import { broadcastMessagesController } from '../controllers/broadcast-messages.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

// Public announcements
router.get('/public', broadcastMessagesController.list);
router.get('/', broadcastMessagesController.list);
router.get('/:id', broadcastMessagesController.getById);

// Admin actions
router.post('/', authenticate, loadPermissions, broadcastMessagesController.create);
router.put('/:id', authenticate, loadPermissions, broadcastMessagesController.update);
router.delete('/:id', authenticate, loadPermissions, broadcastMessagesController.remove);

export default router;
