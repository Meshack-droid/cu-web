import { Router } from 'express';
import { meetingsController } from '../controllers/meetings.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

// Core CRUD
router.get('/', requirePermission('meetings.view'), meetingsController.list);
router.get('/:id', requirePermission('meetings.view'), meetingsController.getById);
router.post('/', requirePermission('meetings.create'), meetingsController.create);
router.put('/:id', requirePermission('meetings.edit'), meetingsController.update);
router.delete('/:id', requirePermission('meetings.delete'), meetingsController.remove);

// Agenda
router.get('/:id/agenda', requirePermission('meetings.view'), meetingsController.getAgenda);
router.post('/:id/agenda', requirePermission('meetings.edit'), meetingsController.addAgendaItem);
router.put('/:id/agenda/reorder', requirePermission('meetings.edit'), meetingsController.reorderAgenda);

// Attendance
router.post('/:id/attendance', requirePermission('attendance.record'), meetingsController.confirmAttendance);
router.get('/:id/attendance', requirePermission('attendance.view'), meetingsController.listAttendance);

// Minutes
router.get('/:id/minutes', requirePermission('meetings.view'), meetingsController.getMinutes);
router.post('/:id/minutes', requirePermission('meetings.manage_minutes'), meetingsController.recordMinutes);
router.post(
  '/:id/minutes/approve',
  requirePermission('meetings.approve_minutes'),
  meetingsController.approveMinutes
);

// Resolutions
router.get('/:id/resolutions', requirePermission('meetings.view'), meetingsController.listResolutions);
router.post('/:id/resolutions', requirePermission('meetings.manage_minutes'), meetingsController.passResolution);

// Lifecycle
router.post('/:id/archive', requirePermission('meetings.archive'), meetingsController.archive);

export default router;
