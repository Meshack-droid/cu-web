import { Router } from 'express';
import { expensesController } from '../controllers/expenses.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

router.get('/', requirePermission('finance.view'), expensesController.list);
router.get('/:id', requirePermission('finance.view'), expensesController.getById);
router.post('/', requirePermission('finance.request'), expensesController.create);

router.post('/:id/treasurer-review', requirePermission('finance.treasurer_review'), expensesController.treasurerReview);
router.post('/:id/secretary-verify', requirePermission('finance.secretary_verify'), expensesController.secretaryVerify);
router.post('/:id/chairperson-approve', requirePermission('finance.approve'), expensesController.chairpersonApprove);
router.post('/:id/mark-paid', requirePermission('finance.pay'), expensesController.markPaid);
router.post('/:id/receipt', requirePermission('finance.pay'), expensesController.recordReceipt);
router.post('/:id/mark-audited', requirePermission('finance.audit'), expensesController.markAudited);
router.post('/:id/reject', requirePermission('finance.approve'), expensesController.reject);

export default router;
