import { Router } from 'express';
import { membershipController } from '../controllers/membership.controller';
import { validate } from '../../../middleware/validate.middleware';
import { membershipValidators } from '../validators/membership.validator';
import { authenticate, loadPermissions, requireAnyPermission, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/applications', requireAnyPermission('membership.review', 'membership.approve'), membershipController.listApplications);
router.post(
  '/applications/:id/approve',
  requirePermission('membership.approve'),
  validate(membershipValidators.approve),
  membershipController.approve
);
router.post(
  '/applications/:id/reject',
  requirePermission('membership.approve'),
  validate(membershipValidators.reject),
  membershipController.reject
);

router.post('/renew', validate(membershipValidators.renew), membershipController.renew);
router.get('/me', membershipController.me);
router.get('/all-members', membershipController.listAllMembers);
router.get('/export', membershipController.exportCsv);
router.delete('/:id', requirePermission('membership.approve'), membershipController.deleteMember);

router.get('/', requirePermission('membership.view_all'), membershipController.list);
router.get('/:id', requirePermission('membership.view_all'), membershipController.getById);

export default router;
