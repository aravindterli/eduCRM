import { create } from 'zustand';
import { leadService, Lead } from '@/services/lead.service';

interface LeadState {
  leads: Lead[];
  stats: any;
  loading: boolean;
  error: string | null;
  fetchLeads: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addLead: (data: Partial<Lead>) => Promise<boolean>;
  importLeads: (leads: any[]) => Promise<any>;
  scheduleCall: (leadId: string, data: { notes: string, scheduledAt: string }) => Promise<boolean>;
  updateStage: (leadId: string, stage: string) => Promise<boolean>;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  stats: null,
  loading: false,
  error: null,
  
  fetchLeads: async () => {
    set({ loading: true });
    try {
      const data = await leadService.getAll();
      set({ leads: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  
  fetchStats: async () => {
    set({ loading: true });
    try {
      const data = await leadService.getStats();
      set({ stats: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  
  addLead: async (data: Partial<Lead>) => {
    set({ loading: true });
    try {
      await leadService.create(data);
      // Fetch leads again to refresh the list
      const leads = await leadService.getAll();
      const stats = await leadService.getStats();
      set({ leads, stats, loading: false });
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
      // Refresh leads and stats
      const updatedLeads = await leadService.getAll();
      const updatedStats = await leadService.getStats();
      set({ leads: updatedLeads, stats: updatedStats, loading: false });
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
      const leads = await leadService.getAll();
      set({ leads, loading: false });
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
      const leads = await leadService.getAll();
      const stats = await leadService.getStats();
      set({ leads, stats, loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  }
}));
