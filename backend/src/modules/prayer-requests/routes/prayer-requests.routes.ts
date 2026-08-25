import { Router } from 'express';
import { prayerRequestsController } from '../controllers/prayer-requests.controller';
import { validate } from '../../../middleware/validate.middleware';
import { prayerRequestValidators } from '../validators/prayer-requests.validator';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('prayer.view'), prayerRequestsController.list);
router.get('/:id', requirePermission('prayer.view'), prayerRequestsController.getById);
router.post('/', requirePermission('prayer.create'), validate(prayerRequestValidators.create), prayerRequestsController.create);
router.put('/:id', requirePermission('prayer.view'), validate(prayerRequestValidators.update), prayerRequestsController.update);

export default router;
