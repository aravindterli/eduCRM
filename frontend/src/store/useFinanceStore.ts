
import { create } from 'zustand';
import { financeService } from '@/services/finance.service';

interface FinanceState {
  fees: any[];
  stats: any;
  loading: boolean;
  fetchFees: () => Promise<void>;
  fetchStats: () => Promise<void>;
  recordPayment: (data: any) => Promise<boolean>;
  getExistingLink: (feeId: string) => Promise<string | null>;
  generatePaymentLink: (feeId: string) => Promise<{ link: string | null, error: string | null, isNew?: boolean }>;
  syncPaymentStatus: (feeId: string) => Promise<{ updated: boolean, message: string }>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  fees: [],
  stats: null,
  loading: false,

  fetchFees: async () => {
    set({ loading: true });
    try {
      const data = await financeService.getAllFees();
      set({ fees: data, loading: false });
    } catch (error: any) {
      if (error.response?.status === 401) return;
      console.error('Operation failed:', error);
    }
  },

  fetchStats: async () => {
    try {
      const data = await financeService.getStats();
      set({ stats: data });
    } catch (error: any) {
      if (error.response?.status === 401) return;
      console.error('Failed to fetch stats:', error);
    }
  },

  recordPayment: async (paymentData: any) => {
    try {
      await financeService.recordPayment(paymentData);
      // Refresh data
      get().fetchFees();
      get().fetchStats();
      return true;
    } catch (error: any) {
      if (error.response?.status === 401) return false;
      console.error('Failed to record payment:', error);
      return false;
    }
  },

  getExistingLink: async (feeId: string) => {
    try {
      const data = await financeService.getExistingLink(feeId);
      return data?.link || null;
    } catch (error: any) {
      if (error.response?.status === 401) return null;
      console.error('Failed to fetch existing link:', error);
      return null;
    }
  },

  generatePaymentLink: async (feeId: string) => {
    try {
      const data = await financeService.generatePaymentLink(feeId);
      return { link: data.link || null, error: null, isNew: data.isNew };
    } catch (error: any) {
      if (error.response?.status === 401) return { link: null, error: null };
      console.error('Failed to generate payment link:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate payment link. Please try again.';
      return { link: null, error: errorMessage };
    }
  },

  syncPaymentStatus: async (feeId: string) => {
    try {
      const result = await financeService.syncPaymentStatus(feeId);
      if (result.updated) {
        get().fetchFees();
        get().fetchStats();
      }
      return { updated: result.updated, message: result.message || 'Check complete' };
    } catch (error: any) {
       if (error.response?.status === 401) return { updated: false, message: '' };
       console.error('Failed to sync payment:', error);
       return { updated: false, message: error.response?.data?.message || 'Sync failed' };
    }
  }
}));
