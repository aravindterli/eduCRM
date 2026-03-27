import { create } from 'zustand';
import { marketingService } from '@/services/marketing.service';

interface MarketingState {
  campaigns: any[];
  webinars: any[];
  isLoading: boolean;
  error: string | null;

  fetchCampaigns: () => Promise<void>;
  fetchWebinars: () => Promise<void>;
  createCampaign: (data: any) => Promise<void>;
  updateCampaign: (id: string, data: any) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  createWebinar: (data: any) => Promise<void>;
  updateWebinar: (id: string, data: any) => Promise<void>;
  deleteWebinar: (id: string) => Promise<void>;
  registerLeadForWebinar: (webinarId: string, leadId: string) => Promise<boolean>;
}

export const useMarketingStore = create<MarketingState>((set) => ({
  campaigns: [],
  webinars: [],
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ isLoading: true });
    try {
      const data = await marketingService.getCampaigns();
      set({ campaigns: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchWebinars: async () => {
    set({ isLoading: true });
    try {
      const data = await marketingService.getWebinars();
      set({ webinars: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createCampaign: async (data) => {
    set({ isLoading: true });
    try {
      await marketingService.createCampaign(data);
      const updated = await marketingService.getCampaigns();
      set({ campaigns: updated, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateCampaign: async (id, data) => {
    set({ isLoading: true });
    try {
      await marketingService.updateCampaign(id, data);
      const updated = await marketingService.getCampaigns();
      set({ campaigns: updated, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteCampaign: async (id) => {
    set({ isLoading: true });
    try {
      await marketingService.deleteCampaign(id);
      const updated = await marketingService.getCampaigns();
      set({ campaigns: updated, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createWebinar: async (data) => {
    set({ isLoading: true });
    try {
      await marketingService.createWebinar(data);
      const updated = await marketingService.getWebinars();
      set({ webinars: updated, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateWebinar: async (id, data) => {
    set({ isLoading: true });
    try {
      await marketingService.updateWebinar(id, data);
      const updated = await marketingService.getWebinars();
      set({ webinars: updated, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteWebinar: async (id) => {
    set({ isLoading: true });
    try {
      await marketingService.deleteWebinar(id);
      const updated = await marketingService.getWebinars();
      set({ webinars: updated, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  registerLeadForWebinar: async (webinarId, leadId) => {
    set({ isLoading: true });
    try {
      await marketingService.registerLeadForWebinar(webinarId, leadId);
      const updated = await marketingService.getWebinars();
      set({ webinars: updated, isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },
}));
