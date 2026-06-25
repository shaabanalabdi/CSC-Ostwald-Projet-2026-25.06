// ============================================================
// features/admin-events — API publique.
// Réservé aux admins : CRUD complet sur la table des événements d'agenda.
// ============================================================
export { useEvents } from './api/useEvents';
export { useEvent } from './api/useEvent';
export { useCreateEvent } from './api/useCreateEvent';
export { useUpdateEvent } from './api/useUpdateEvent';
export { useDeleteEvent } from './api/useDeleteEvent';
export { eventSchema } from './schemas/event.schema';
