import { Router } from 'express';
import { broadcastMessagesController } from '../controllers/broadcast-messages.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('communication.view'), broadcastMessagesController.list);
router.get('/:id', requirePermission('communication.view'), broadcastMessagesController.getById);
router.post('/', requirePermission('communication.create'), broadcastMessagesController.create);
router.put('/:id', requirePermission('communication.edit'), broadcastMessagesController.update);
router.delete('/:id', requirePermission('communication.delete'), broadcastMessagesController.remove);

export default router;
