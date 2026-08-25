import { Router } from 'express';
import { ministriesController, ministryDetailsController } from '../controllers/ministries.controller';
import { authenticate, enforceScope, loadPermissions, requireAnyPermission, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

// Ministries are public information on the TUMCU website (Chapter 42 —
// "Featured Ministries" section) — no login required to browse them.
router.get('/', ministriesController.list);
router.get('/:id/details', ministryDetailsController.get);
router.get('/:id', ministriesController.getById);

// Managing ministries (creating, editing, removing) still requires
// authentication and the relevant permission.
router.post('/', authenticate, loadPermissions, requirePermission('ministries.create'), ministriesController.create);
router.put(
  '/:id',
  authenticate,
  loadPermissions,
  requireAnyPermission('ministries.edit', 'ministries.manage_details'),
  enforceScope('ministry', 'ministries.edit', (req) => req.params.id),
  ministriesController.update
);
router.delete(
  '/:id',
  authenticate,
  loadPermissions,
  requirePermission('ministries.delete'),
  ministriesController.remove
);

export default router;
