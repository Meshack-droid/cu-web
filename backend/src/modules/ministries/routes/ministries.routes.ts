import { Router } from 'express';
import { ministriesController, ministryDetailsController } from '../controllers/ministries.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', ministriesController.list);
router.get('/leader-portal', authenticate, ministryDetailsController.getLeaderPortal);
router.get('/:id/details', ministryDetailsController.get);
router.get('/:id/members', authenticate, ministryDetailsController.getMembers);
router.get('/:id/sessions', authenticate, ministryDetailsController.getSessions);
router.get('/:id', ministriesController.getById);

// Ministry leader / Admin actions
router.post('/:id/sessions', authenticate, ministryDetailsController.createSession);
router.post('/:id/assign-leader', authenticate, ministryDetailsController.assignLeader);

// Full CRUD for Super Admin / authorized leaders
router.post('/', authenticate, loadPermissions, ministriesController.create);
router.put('/:id', authenticate, loadPermissions, ministriesController.update);
router.delete('/:id', authenticate, loadPermissions, ministriesController.remove);

export default router;
