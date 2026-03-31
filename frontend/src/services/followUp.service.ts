import api from '@/utils/api';

export interface FollowUp {
  id: string;
  leadId: string;
  counselorId: string;
  notes: string;
  scheduledAt: string;
  completedAt: string | null;
  meetingUrl: string | null;
  lead?: { id: string; name: string; phone: string; stage: string };
}

export const followUpService = {
  getUpcoming: async (): Promise<FollowUp[]> => {
    const res = await api.get('/leads/follow-ups/upcoming');
    return res.data;
  },

  getByLead: async (leadId: string): Promise<FollowUp[]> => {
    const res = await api.get(`/leads/${leadId}/follow-ups`);
    return res.data;
  },

  create: async (leadId: string, data: { notes: string; scheduledAt: string }): Promise<FollowUp> => {
    const res = await api.post(`/leads/${leadId}/follow-up`, data);
    return res.data;
  },

  complete: async (id: string): Promise<FollowUp> => {
    const res = await api.patch(`/leads/follow-ups/${id}/complete`);
    return res.data;
  },

  update: async (id: string, data: { notes?: string; scheduledAt?: string }): Promise<FollowUp> => {
    const res = await api.patch(`/leads/follow-ups/${id}`, data);
    return res.data;
  },
};
