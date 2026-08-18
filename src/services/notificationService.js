import api from './api';

export const notificationService = {
  /** Fetch all unread notifications for the logged-in user. */
  getUnread: async () => {
    const response = await api.get('/admin/notifications');
    return response.data;
  },

  /** Mark a specific notification as read. */
  markRead: async (id) => {
    const response = await api.patch(`/admin/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Trigger backend scan for overdue payment orders.
   * Idempotent — safe to call repeatedly; backend skips already-notified orders.
   */
  checkOverdue: async () => {
    const response = await api.post('/admin/notifications/check-overdue');
    return response.data;
  },
};
