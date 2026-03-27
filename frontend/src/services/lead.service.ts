import api from '@/utils/api';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: string;
  leadSource: string;
  campaignId?: string;
  createdAt: string;
}

export const leadService = {
  getAll: async () => {
    const response = await api.get('/leads');
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
  }
};
