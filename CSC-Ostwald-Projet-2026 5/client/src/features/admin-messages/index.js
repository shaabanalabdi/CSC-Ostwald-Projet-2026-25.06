// ============================================================
// features/admin-messages — Public API.
//
// Admin-only feature: list/read/delete contact form submissions.
// Consumed exclusively by pages/AdminMessages (no public surface).
// ============================================================
export { useMessages } from './api/useMessages';
export { useMarkMessageAsRead } from './api/useMarkMessageAsRead';
export { useDeleteMessage } from './api/useDeleteMessage';
