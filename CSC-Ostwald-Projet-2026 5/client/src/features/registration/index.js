// ============================================================
// features/registration — API publique.
//
// Inscription à une activité Jeunesse avec paiement HelloAsso. Consommée
// par pages/InscriptionJeunesse et pages/InscriptionConfirmee.
// ============================================================
export { useCheckout } from './api/useCheckout';
export { createRegistrationSchema } from './schemas/registration.schema';
export { parseCoutToCents } from './utils/parseCout';
