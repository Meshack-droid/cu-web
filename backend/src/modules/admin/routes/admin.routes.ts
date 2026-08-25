import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { validate } from '../../../middleware/validate.middleware';
import { adminValidators } from '../validators/admin.validator';
import { authenticate, loadPermissions, requireAnyPermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions, requireAnyPermission('leadership.assign', 'system.manage_roles'));

router.get('/users/search', adminController.searchUsers);
router.get('/roles', adminController.listRoles);
router.get('/role-permissions', adminController.listRolePermissionMatrix);
router.get('/ministries', adminController.listMinistries);
router.get('/committees', adminController.listCommittees);
router.get('/user-roles', adminController.listUserRoles);
router.post('/user-roles', validate(adminValidators.assignRole), adminController.assignRole);
router.delete('/user-roles/:id', adminController.revokeRole);

export default router;
