import { Router, Request } from 'express';
import { ministryMembersController, ministrySelfController } from '../controllers/ministry-members.controller';
import { MinistryMembersService } from '../services/ministry-members.service';
import {
  authenticate,
  enforceScope,
  loadPermissions,
  requirePermission,
  requireAnyPermission,
} from '../../../middleware/auth.middleware';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router();
const service = new MinistryMembersService();

router.use(authenticate, loadPermissions);

// Self-service ministry connection is available to admitted active members;
// it does not grant management privileges or change RBAC roles.
router.post('/join', ministrySelfController.join);
router.get('/my-ministries', ministrySelfController.listMine);
router.get('/mine/:ministryId', ministrySelfController.get);
router.delete('/mine/:ministryId', ministrySelfController.leave);

// Listing/viewing the roster still requires ministries.view — every
// authenticated member can see who's in a ministry, that's not sensitive.
router.get('/', requirePermission('ministries.view'), ministryMembersController.list);
router.get('/:id', requirePermission('ministries.view'), ministryMembersController.getById);

// Adding a member: request body carries ministry_id directly.
router.post(
  '/',
  requireAnyPermission('ministries.manage_members', 'ministries.manage_all_members'),
  enforceScope('ministry', 'ministries.manage_all_members', (req: Request) => req.body?.ministry_id),
  ministryMembersController.create
);

// Editing/removing an existing roster row: look up which ministry it
// belongs to first (the request body/URL doesn't carry that), then scope-check.
router.put(
  '/:id',
  requireAnyPermission('ministries.manage_members', 'ministries.manage_all_members'),
  asyncHandler(async (req, _res, next) => {
    const ministryId = await service.findMinistryIdForRecord(req.params.id);
    (req as Request & { _resolvedMinistryId?: string | null })._resolvedMinistryId = ministryId;
    next();
  }),
  enforceScope(
    'ministry',
    'ministries.manage_all_members',
    (req) => (req as Request & { _resolvedMinistryId?: string | null })._resolvedMinistryId
  ),
  ministryMembersController.update
);

router.delete(
  '/:id',
  requireAnyPermission('ministries.manage_members', 'ministries.manage_all_members'),
  asyncHandler(async (req, _res, next) => {
    const ministryId = await service.findMinistryIdForRecord(req.params.id);
    (req as Request & { _resolvedMinistryId?: string | null })._resolvedMinistryId = ministryId;
    next();
  }),
  enforceScope(
    'ministry',
    'ministries.manage_all_members',
    (req) => (req as Request & { _resolvedMinistryId?: string | null })._resolvedMinistryId
  ),
  ministryMembersController.remove
);

export default router;
