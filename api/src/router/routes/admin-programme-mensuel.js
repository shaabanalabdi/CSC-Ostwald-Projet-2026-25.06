import { Router } from 'express';
import { ProgrammeMensuelAdminController } from '../../controller/ProgrammeMensuelAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', ProgrammeMensuelAdminController.list);
router.get('/:id', ProgrammeMensuelAdminController.getOne);
router.post('/', ProgrammeMensuelAdminController.create);
router.patch('/:id', ProgrammeMensuelAdminController.update);
router.delete('/:id', ProgrammeMensuelAdminController.remove);

export default router;
