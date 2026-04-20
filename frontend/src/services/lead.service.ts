import api from '@/utils/api';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: string;
  leadSource: string;
  tag?: string;
  campaignId?: string;
  createdAt: string;
}

export const leadService = {
  getAll: async (page = 1, limit = 10, filters: any = {}) => {
    const response = await api.get('/leads', {
      params: { page, limit, ...filters }
    });
    return response.data;
  },

  create: async (data: Partial<Lead>) => {
    const response = await api.post('/leads', data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/leads/stats');
    return response.data;
  },

  bulkImport: async (leads: any[]) => {
    const response = await api.post('/leads/import', { leads });
    return response.data;
  },

  scheduleCall: async (leadId: string, data: { notes: string, scheduledAt: string }) => {
    const response = await api.post(`/leads/${leadId}/follow-up`, data);
    return response.data;
  },

  updateStage: async (leadId: string, stage: string) => {
    const response = await api.patch(`/leads/${leadId}/stage`, { stage });
    return response.data;
  },

  update: async (leadId: string, data: Partial<Lead>) => {
    const response = await api.patch(`/leads/${leadId}`, data);
    return response.data;
  },

  delete: async (leadId: string) => {
    const response = await api.delete(`/leads/${leadId}`);
    return response.data;
  },

  reactivateLead: async (id: string) => {
    const response = await api.post(`/leads/${id}/reactivate`);
    return response.data;
  },

  bulkSendWhatsApp: async (leadIds: string[], message: string, imageUrl?: string, templateName?: string) => {
    const response = await api.post('/leads/bulk-whatsapp', { leadIds, message, imageUrl, templateName });
    return response.data;
  },

  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/leads/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getMetaPages: async () => {
    const response = await api.get('/leads/meta/pages');
    return response.data;
  },

  subscribeToMetaPage: async (pageId: string) => {
    const response = await api.post('/leads/webhook/meta/subscribe', { pageId });
    return response.data;
  },
};
