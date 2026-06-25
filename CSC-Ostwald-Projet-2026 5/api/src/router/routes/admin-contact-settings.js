import { Router } from 'express';
import { ContactSettingsAdminController } from '../../controller/ContactSettingsAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', ContactSettingsAdminController.get);
router.patch('/', ContactSettingsAdminController.update);

export default router;
