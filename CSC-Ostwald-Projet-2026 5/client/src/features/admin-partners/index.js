// ============================================================
// features/admin-partners — API publique.
// Réservé aux admins : CRUD complet sur la table des partenaires.
// ============================================================
export { usePartners } from './api/usePartners';
export { usePartner } from './api/usePartner';
export { useCreatePartner } from './api/useCreatePartner';
export { useUpdatePartner } from './api/useUpdatePartner';
export { useDeletePartner } from './api/useDeletePartner';
export { useReorderPartners } from './api/useReorderPartners';
export { partnerSchema, PARTNER_CATEGORIES } from './schemas/partner.schema';
