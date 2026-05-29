import api from './api';

export const notificationService = {
  getAll: async (token?: string | null) => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string, token?: string | null) => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllRead: async (token?: string | null) => {
    await api.put('/notifications/mark-all-read');
  },

  clearAll: async (token?: string | null) => {
    await api.delete('/notifications/clear-all');
  },

  delete: async (id: string, token?: string | null) => {
    await api.delete(`/notifications/${id}`);
  }
};
