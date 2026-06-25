// ============================================================
// features/admin-activities — API publique.
// Réservé aux admins : CRUD complet sur le catalogue d'activités.
// ============================================================
export { useActivities } from './api/useActivities';
export { useActivity } from './api/useActivity';
export { useCreateActivity } from './api/useCreateActivity';
export { useUpdateActivity } from './api/useUpdateActivity';
export { useDeleteActivity } from './api/useDeleteActivity';
export { activitySchema, ACTIVITY_TYPES, ACTIVITY_FREQUENCES } from './schemas/activity.schema';
