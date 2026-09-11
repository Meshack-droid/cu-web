import { Router } from 'express';
import { leadershipController } from '../controllers/leadership.controller';
import { authenticate, loadPermissions, requireAnyPermission, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

// Personal responsibilities widget for any logged-in leader/member
router.get('/my-responsibilities', leadershipController.getMyResponsibilities);

// Leadership positions & assignments
router.get('/positions', leadershipController.listPositions);
router.get('/overview', leadershipController.getOverview);
router.get('/assignments', requireAnyPermission('leadership.view', 'system.manage_roles'), leadershipController.listAssignments);
router.post('/assignments', requireAnyPermission('leadership.assign', 'system.manage_roles'), leadershipController.assignLeader);
router.put('/assignments/:id', requireAnyPermission('leadership.assign', 'system.manage_roles'), leadershipController.updateAssignment);
router.post('/positions/:positionId/appoint', requireAnyPermission('leadership.assign', 'system.manage_roles'), leadershipController.appointReplacement);
router.delete('/assignments/:id', requireAnyPermission('leadership.assign', 'system.manage_roles'), leadershipController.revokeAssignment);

// Base CRUD fallbacks
router.get('/', requirePermission('leadership.view'), leadershipController.list);
router.get('/:id', requirePermission('leadership.view'), leadershipController.getById);
router.post('/', requirePermission('leadership.create'), leadershipController.create);
router.put('/:id', requirePermission('leadership.edit'), leadershipController.update);
router.delete('/:id', requirePermission('leadership.delete'), leadershipController.remove);

export default router;

