// ============================================================
// admin-registrations.js — CRUD admin sur la table `registration`.
// Toutes les routes protégées par router.use(isAuthenticated).
// ============================================================

import { Router } from 'express';
import { RegistrationAdminController } from '../../controller/RegistrationAdminController.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();
router.use(isAuthenticated);

// Accès en lecture : admin et editor (pour que les editors puissent
// auditer les paiements entrants). Accès en écriture : admin uniquement
// — ces endpoints touchent aux enregistrements financiers
// (remboursements, changements de statut, suppression), que seul le rôle
// le plus élevé devrait muter.
const READ = requireRole('admin', 'editor');
const WRITE = requireRole('admin');

// `/export.csv` déclarée avant toute route `:id` pour qu'Express ne
// route pas le littéral « export.csv » à travers un matcher `:id`.
router.get('/export.csv', READ, RegistrationAdminController.exportCsv);
router.get('/', READ, RegistrationAdminController.list);
router.get('/:id', READ, RegistrationAdminController.getOne);
router.patch('/:id/status', WRITE, RegistrationAdminController.updateStatus);
router.delete('/:id', WRITE, RegistrationAdminController.remove);

export default router;
