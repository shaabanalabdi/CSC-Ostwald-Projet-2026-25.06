// ============================================================
// features/admin-projet-social — CRUD admin pour les documents du
// Projet Social.
// ============================================================
export { useProjetSocialDocuments } from './api/useProjetSocialDocuments';
export { useProjetSocialDocument } from './api/useProjetSocialDocument';
export { useCreateProjetSocialDocument } from './api/useCreateProjetSocialDocument';
export { useUpdateProjetSocialDocument } from './api/useUpdateProjetSocialDocument';
export { useDeleteProjetSocialDocument } from './api/useDeleteProjetSocialDocument';
export { useReorderProjetSocialDocuments } from './api/useReorderProjetSocialDocuments';
export {
  projetSocialDocumentSchema,
  PROJET_SOCIAL_COLORS,
} from './schemas/projetSocialDocument.schema';
