import { Router } from 'express';
import { ContactSettingsController } from '../../controller/ContactSettingsController.js';

const router = Router();

router.get('/', ContactSettingsController.get);

export default router;
