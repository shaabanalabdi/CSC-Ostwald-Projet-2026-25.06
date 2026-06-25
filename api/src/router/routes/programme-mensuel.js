import { Router } from 'express';
import { ProgrammeMensuelController } from '../../controller/ProgrammeMensuelController.js';

const router = Router();
router.get('/', ProgrammeMensuelController.list);

export default router;
