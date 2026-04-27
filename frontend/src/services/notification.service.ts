import api from './api';

export const notificationService = {
  getAll: async (token?: string | null) => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string) => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllRead: async () => {
    await api.put('/notifications/mark-all-read');
  },

  clearAll: async () => {
    await api.delete('/notifications/clear-all');
  },

  delete: async (id: string) => {
    await api.delete(`/notifications/${id}`);
  }
};
