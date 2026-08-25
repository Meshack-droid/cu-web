import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../../../middleware/validate.middleware';
import { authValidators } from '../validators/auth.validator';
import { authenticate, loadPermissions } from '../../../middleware/auth.middleware';

const router = Router();

router.post('/register', validate(authValidators.register), authController.register);
router.post('/login', validate(authValidators.login), authController.login);
router.post('/refresh', validate(authValidators.refresh), authController.refresh);
router.post('/logout', validate(authValidators.refresh), authController.logout);
router.post('/logout-everywhere', authenticate, authController.logoutEverywhere);
router.get('/me', authenticate, loadPermissions, authController.me);

export default router;
