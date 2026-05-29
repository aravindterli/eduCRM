import api from './api';

export const authService = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  invite: async (userData: any) => {
    const response = await api.post('/auth/invite', userData);
    return response.data;
  },
  getInvitations: async () => {
    const response = await api.get('/auth/invitations');
    return response.data;
  },
  resendInvitation: async (id: string) => {
    const response = await api.post(`/auth/invitations/${id}/resend`);
    return response.data;
  },
  getRoles: async () => {
    const response = await api.get('/auth/roles');
    return response.data;
  },
  acceptInvite: async (data: any) => {
    const response = await api.post('/auth/accept-invite', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },
  updateProfile: async (data: { name?: string; email?: string; theme?: string; accent?: string }) => {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },
};
