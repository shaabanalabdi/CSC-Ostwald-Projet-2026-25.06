// ============================================================
// admin-newsletter.js — Liste/suppression admin pour newsletter_subscriber.
// Toutes les routes protégées par auth.
// ============================================================

import { Router } from 'express';
import { NewsletterAdminController } from '../../controller/NewsletterAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';

const router = Router();
router.use(isAuthenticated);

// `/export.csv` déclarée avant toute route `:id` pour qu'Express ne
// route pas le littéral « export.csv » à travers un matcher `:id`.
router.get('/export.csv', NewsletterAdminController.exportCsv);
router.get('/', NewsletterAdminController.list);
router.delete('/:id', NewsletterAdminController.remove);

export default router;
