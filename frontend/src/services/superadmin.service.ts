import api from './api';

export const superadminService = {
  getTenants: async () => {
    const response = await api.get('/superadmin/tenants');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/superadmin/stats');
    return response.data;
  },

  createTenant: async (data: any) => {
    const response = await api.post('/superadmin/tenants', data);
    return response.data;
  },

  updateTenant: async (id: string, data: any) => {
    const response = await api.put(`/superadmin/tenants/${id}`, data);
    return response.data;
  },

  getGlobalLeads: async (params?: { limit?: number; offset?: number; sector?: string; search?: string }) => {
    const response = await api.get('/superadmin/leads', { params });
    return response.data;
  },

  getBilling: async () => {
    const response = await api.get('/superadmin/billing');
    return response.data;
  },

  getForms: async (sector?: string) => {
    const response = await api.get('/superadmin/forms', { params: { sector } });
    return response.data;
  },

  createForm: async (data: any) => {
    const response = await api.post('/superadmin/forms', data);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/superadmin/analytics');
    return response.data;
  }
};
