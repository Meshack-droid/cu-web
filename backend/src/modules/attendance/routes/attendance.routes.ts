import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/me', attendanceController.me);
router.post('/self-check-in', attendanceController.selfCheckIn);

router.get('/', requirePermission('attendance.view'), attendanceController.list);
router.get('/:id', requirePermission('attendance.view'), attendanceController.getById);
router.post('/', requirePermission('attendance.record'), attendanceController.recordForOthers);
router.put('/:id', requirePermission('attendance.edit'), attendanceController.update);
router.delete('/:id', requirePermission('attendance.delete'), attendanceController.remove);

export default router;
