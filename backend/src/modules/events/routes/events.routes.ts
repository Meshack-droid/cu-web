import { Router } from 'express';
import { eventsController } from '../controllers/events.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

// Public site listing (Chapter 42 — "Upcoming Events" homepage section).
// Only ever returns approved/open/ongoing/completed events — never drafts.
router.get('/public', eventsController.listPublic);

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('events.view'), eventsController.list);
router.get('/:id', requirePermission('events.view'), eventsController.getById);
router.post('/', requirePermission('events.create'), eventsController.create);
router.put('/:id', requirePermission('events.edit'), eventsController.update);
router.delete('/:id', requirePermission('events.delete'), eventsController.remove);

router.post('/:id/approve', requirePermission('events.approve'), eventsController.approve);
router.post('/:id/open-registration', requirePermission('events.edit'), eventsController.openRegistration);
router.post('/:id/register', requirePermission('events.register'), eventsController.register);
router.post('/:id/check-in', requirePermission('events.check_in'), eventsController.checkIn);
router.get('/:id/registrations', requirePermission('events.view'), eventsController.listRegistrations);
router.delete(
  '/:id/registrations/:registrationId',
  requirePermission('events.register'),
  eventsController.cancelRegistration
);
router.post('/:id/archive', requirePermission('events.edit'), eventsController.archive);

export default router;
