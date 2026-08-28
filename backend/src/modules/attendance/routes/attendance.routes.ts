import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

// Public endpoints (no token strictly required — allows guest QR code check-in)
router.get('/public/sessions/active', attendanceController.getActivePublicSessions);
router.get('/public/sessions/:id', attendanceController.getSession);
router.post('/public/check-in', attendanceController.publicCheckIn);

// Authenticated endpoints
router.use(authenticate, loadPermissions);

router.get('/me', attendanceController.me);
router.post('/self-check-in', attendanceController.selfCheckIn);

// Session & QR management
router.get('/sessions', requirePermission('attendance.view'), attendanceController.listSessions);
router.post('/sessions', requirePermission('attendance.record'), attendanceController.createSession);
router.get('/sessions/:id', requirePermission('attendance.view'), attendanceController.getSession);
router.put('/sessions/:id', requirePermission('attendance.record'), attendanceController.updateSession);
router.get('/sessions/:id/roster', requirePermission('attendance.view'), attendanceController.getSessionRoster);
router.get('/sessions/:id/export', requirePermission('attendance.view'), attendanceController.exportCsv);
router.get('/export', requirePermission('attendance.view'), attendanceController.exportCsv);

// Manual check-ins & core records
router.post('/manual-check-in', requirePermission('attendance.record'), attendanceController.recordForOthers);
router.get('/', requirePermission('attendance.view'), attendanceController.list);
router.get('/:id', requirePermission('attendance.view'), attendanceController.getById);
router.post('/', requirePermission('attendance.record'), attendanceController.recordForOthers);
router.put('/:id', requirePermission('attendance.edit'), attendanceController.update);
router.delete('/:id', requirePermission('attendance.delete'), attendanceController.remove);

export default router;

