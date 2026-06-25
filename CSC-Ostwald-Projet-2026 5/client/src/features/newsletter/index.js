// ============================================================
// features/newsletter — API publique
//
// Formulaire d'inscription à la newsletter du pied de page (RHF + Zod +
// React Query + MSW). Consommé par components/Footer.jsx ; l'UI du
// formulaire elle-même vit dans Footer car la newsletter fait partie de
// l'habillage global de mise en page, pas d'une page autonome.
// ============================================================
export { useNewsletterSubscribe } from './api/useNewsletterSubscribe';
export { createNewsletterSchema } from './schemas/newsletter.schema';
