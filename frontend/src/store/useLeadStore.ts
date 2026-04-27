import { create } from 'zustand';
import { leadService, Lead } from '@/services/lead.service';

interface LeadState {
  leads: Lead[];
  stats: any;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  fetchLeads: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchStats: () => Promise<void>;
  addLead: (data: Partial<Lead>) => Promise<boolean>;
  importLeads: (leads: any[]) => Promise<any>;
  scheduleCall: (leadId: string, data: { notes: string, scheduledAt: string }) => Promise<boolean>;
  updateStage: (leadId: string, stage: string) => Promise<boolean>;
  updateLead: (leadId: string, data: Partial<Lead>) => Promise<boolean>;
  deleteLead: (leadId: string) => Promise<boolean>;
  reactivateLead: (leadId: string) => Promise<boolean>;
  bulkSendWhatsApp: (leadIds: string[], message: string, imageUrl?: string, templateName?: string) => Promise<any>;
  uploadMedia: (file: File) => Promise<string | null>;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  stats: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,

  fetchLeads: async (page, limit, filters) => {
    set({ loading: true });
    try {
      const currentPage = page || get().page;
      const currentLimit = limit || get().limit;
      const response = await leadService.getAll(currentPage, currentLimit, filters);
      set({ 
        leads: response.leads, 
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        loading: false 
      });
    } catch (err: any) {
      if (err.response?.status === 401) return;
      set({ error: err.message, loading: false });
    }
  },

  fetchStats: async () => {
    set({ loading: true });
    try {
      const data = await leadService.getStats();
      set({ stats: data, loading: false });
    } catch (err: any) {
      if (err.response?.status === 401) return;
      set({ error: err.message, loading: false });
    }
  },

  addLead: async (data: Partial<Lead>) => {
    set({ loading: true });
    try {
      await leadService.create(data);
      const { page, limit } = get();
      const response = await leadService.getAll(page, limit);
      const stats = await leadService.getStats();
      set({ 
        leads: response.leads,
        total: response.total,
        totalPages: response.totalPages,
        stats, 
        loading: false 
      });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  importLeads: async (leads: any[]) => {
    set({ loading: true });
    try {
      const results = await leadService.bulkImport(leads);
      const { page, limit } = get();
      const response = await leadService.getAll(page, limit);
      const stats = await leadService.getStats();
      set({ 
        leads: response.leads,
        total: response.total,
        totalPages: response.totalPages,
        stats, 
        loading: false 
      });
      return results;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  scheduleCall: async (leadId, data) => {
    set({ loading: true });
    try {
      await leadService.scheduleCall(leadId, data);
      const { page, limit } = get();
      const response = await leadService.getAll(page, limit);
      set({ 
        leads: response.leads,
        total: response.total,
        totalPages: response.totalPages,
        loading: false 
      });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  updateStage: async (leadId, stage) => {
    set({ loading: true });
    try {
      await leadService.updateStage(leadId, stage);
      const { page, limit } = get();
      const response = await leadService.getAll(page, limit);
      const stats = await leadService.getStats();
      set({ 
        leads: response.leads,
        total: response.total,
        totalPages: response.totalPages,
        stats, 
        loading: false 
      });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  updateLead: async (leadId, data) => {
    set({ loading: true });
    try {
      await leadService.update(leadId, data);
      const { page, limit } = get();
      const response = await leadService.getAll(page, limit);
      set({ 
        leads: response.leads,
        total: response.total,
        totalPages: response.totalPages,
        loading: false 
      });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  deleteLead: async (leadId) => {
    set({ loading: true });
    try {
      await leadService.delete(leadId);
      const { page, limit } = get();
      const response = await leadService.getAll(page, limit);
      const stats = await leadService.getStats();
      set({ 
        leads: response.leads,
        total: response.total,
        totalPages: response.totalPages,
        stats, 
        loading: false 
      });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  reactivateLead: async (leadId) => {
    set({ loading: true });
    try {
      await leadService.reactivateLead(leadId);
      const { page, limit } = get();
      const response = await leadService.getAll(page, limit);
      const stats = await leadService.getStats();
      set({ 
        leads: response.leads,
        total: response.total,
        totalPages: response.totalPages,
        stats, 
        loading: false 
      });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  bulkSendWhatsApp: async (leadIds, message, imageUrl, templateName) => {
    set({ loading: true });
    try {
      const results = await leadService.bulkSendWhatsApp(leadIds, message, imageUrl, templateName);
      set({ loading: false });
      return results;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  uploadMedia: async (file) => {
    set({ loading: true });
    try {
      const result = await leadService.uploadMedia(file);
      set({ loading: false });
      return result.url;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  }
}));
