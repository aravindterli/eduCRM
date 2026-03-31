import { create } from 'zustand';
import { followUpService, FollowUp } from '@/services/followUp.service';

interface FollowUpState {
  upcoming: FollowUp[];
  leadFollowUps: FollowUp[];
  loading: boolean;
  error: string | null;
  fetchUpcoming: () => Promise<void>;
  fetchByLead: (leadId: string) => Promise<void>;
  create: (leadId: string, data: { notes: string; scheduledAt: string }) => Promise<FollowUp | null>;
  complete: (id: string) => Promise<boolean>;
  edit: (id: string, data: { notes?: string; scheduledAt?: string }) => Promise<boolean>;
}

export const useFollowUpStore = create<FollowUpState>((set, get) => ({
  upcoming: [],
  leadFollowUps: [],
  loading: false,
  error: null,

  fetchUpcoming: async () => {
    set({ loading: true, error: null });
    try {
      const data = await followUpService.getUpcoming();
      set({ upcoming: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchByLead: async (leadId) => {
    set({ loading: true, error: null });
    try {
      const data = await followUpService.getByLead(leadId);
      set({ leadFollowUps: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  create: async (leadId, data) => {
    set({ loading: true, error: null });
    try {
      const followUp = await followUpService.create(leadId, data);
      // refresh both lists
      const [upcoming, leadFollowUps] = await Promise.all([
        followUpService.getUpcoming(),
        followUpService.getByLead(leadId),
      ]);
      set({ upcoming, leadFollowUps, loading: false });
      return followUp;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  complete: async (id) => {
    set({ loading: true, error: null });
    try {
      const updated = await followUpService.complete(id);
      const updateList = (list: FollowUp[]) =>
        list.map((f) => (f.id === id ? updated : f));
      set((s) => ({
        upcoming: s.upcoming.filter((f) => f.id !== id),
        leadFollowUps: updateList(s.leadFollowUps),
        loading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  edit: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await followUpService.update(id, data);
      const updateList = (list: FollowUp[]) =>
        list.map((f) => (f.id === id ? updated : f));
      set((s) => ({
        upcoming: updateList(s.upcoming),
        leadFollowUps: updateList(s.leadFollowUps),
        loading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },
}));
