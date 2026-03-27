import API from './api';

export const marketingService = {
  // Campaigns
  getCampaigns: async () => {
    const response = await API.get('/campaigns/roi');
    return response.data;
  },

  createCampaign: async (data: any) => {
    const response = await API.post('/campaigns', data);
    return response.data;
  },

  // Webinars
  getWebinars: async () => {
    const response = await API.get('/webinars');
    return response.data;
  },

  createWebinar: async (data: any) => {
    const response = await API.post('/webinars', data);
    return response.data;
  },

  updateWebinar: async (id: string, data: any) => {
    const response = await API.put(`/webinars/${id}`, data);
    return response.data;
  },

  deleteWebinar: async (id: string) => {
    const response = await API.delete(`/webinars/${id}`);
    return response.data;
  },

  updateCampaign: async (id: string, data: any) => {
    const response = await API.patch(`/campaigns/${id}`, data);
    return response.data;
  },

  deleteCampaign: async (id: string) => {
    const response = await API.delete(`/campaigns/${id}`);
    return response.data;
  },

  registerLeadForWebinar: async (webinarId: string, leadId: string) => {
    const response = await API.post(`/webinars/${webinarId}/register`, { leadId });
    return response.data;
  }
};
