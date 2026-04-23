import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const getHeaders = (token?: string | null) => {
  const finalToken = token || localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${finalToken}` } };
};

export const notificationService = {
  getAll: async (token?: string | null) => {
    const response = await axios.get(`${API_URL}/notifications`, getHeaders(token));
    return response.data;
  },

  markAsRead: async (id: string, token?: string | null) => {
    await axios.put(`${API_URL}/notifications/${id}/read`, {}, getHeaders(token));
  },

  markAllRead: async (token?: string | null) => {
    await axios.put(`${API_URL}/notifications/mark-all-read`, {}, getHeaders(token));
  },

  clearAll: async (token?: string | null) => {
    await axios.delete(`${API_URL}/notifications/clear-all`, getHeaders(token));
  },

  delete: async (id: string, token?: string | null) => {
    await axios.delete(`${API_URL}/notifications/${id}`, getHeaders(token));
  }
};
