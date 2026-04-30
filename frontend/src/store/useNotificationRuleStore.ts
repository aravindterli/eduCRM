import { create } from 'zustand';
import API from '../services/api';

export interface NotificationRule {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  channel: string;
  templateId?: string;
  offsets: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  template?: { id: string; name: string; channel: string } | null;
}

export interface ScheduledNotification {
  id: string;
  ruleId?: string;
  trigger: string;
  channel: string;
  recipientId?: string;
  contactInfo?: string;
  templateKey?: string;
  subject?: string;
  body?: string;
  scheduledAt: string;
  sentAt?: string;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';
  retryCount: number;
  errorLog?: string;
  leadId?: string;
  createdAt: string;
}

interface NotificationRuleState {
  rules: NotificationRule[];
  queue: ScheduledNotification[];
  loading: boolean;
  queueLoading: boolean;

  fetchRules: () => Promise<void>;
  createRule: (data: Partial<NotificationRule>) => Promise<boolean>;
  updateRule: (id: string, data: Partial<NotificationRule>) => Promise<boolean>;
  deleteRule: (id: string) => Promise<boolean>;
  toggleRule: (id: string) => Promise<boolean>;

  fetchQueue: (opts?: { status?: string; channel?: string; limit?: number }) => Promise<void>;
  scheduleOne: (data: any) => Promise<boolean>;
  cancelQueued: (id: string) => Promise<boolean>;
  retryQueued: (id: string) => Promise<boolean>;
}

export const useNotificationRuleStore = create<NotificationRuleState>((set, get) => ({
  rules: [],
  queue: [],
  loading: false,
  queueLoading: false,

  fetchRules: async () => {
    set({ loading: true });
    try {
      const { data } = await API.get('/notification-rules');
      set({ rules: data });
    } catch (err) {
      console.error('[NotificationRuleStore] Failed to fetch rules:', err);
    } finally {
      set({ loading: false });
    }
  },

  createRule: async (ruleData) => {
    set({ loading: true });
    try {
      await API.post('/notification-rules', ruleData);
      await get().fetchRules();
      return true;
    } catch (err) {
      console.error('[NotificationRuleStore] Failed to create rule:', err);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updateRule: async (id, ruleData) => {
    set({ loading: true });
    try {
      await API.put(`/notification-rules/${id}`, ruleData);
      await get().fetchRules();
      return true;
    } catch (err) {
      console.error('[NotificationRuleStore] Failed to update rule:', err);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deleteRule: async (id) => {
    set({ loading: true });
    try {
      await API.delete(`/notification-rules/${id}`);
      set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }));
      return true;
    } catch (err) {
      console.error('[NotificationRuleStore] Failed to delete rule:', err);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  toggleRule: async (id) => {
    try {
      const { data } = await API.patch(`/notification-rules/${id}/toggle`);
      set((s) => ({ rules: s.rules.map((r) => (r.id === id ? data : r)) }));
      return true;
    } catch (err) {
      console.error('[NotificationRuleStore] Failed to toggle rule:', err);
      return false;
    }
  },

  fetchQueue: async (opts = {}) => {
    set({ queueLoading: true });
    try {
      const params = new URLSearchParams();
      if (opts.status) params.set('status', opts.status);
      if (opts.channel) params.set('channel', opts.channel);
      if (opts.limit) params.set('limit', String(opts.limit));
      const { data } = await API.get(`/notification-rules/queue?${params.toString()}`);
      set({ queue: data });
    } catch (err) {
      console.error('[NotificationRuleStore] Failed to fetch queue:', err);
    } finally {
      set({ queueLoading: false });
    }
  },

  scheduleOne: async (payload) => {
    try {
      await API.post('/notification-rules/schedule', payload);
      await get().fetchQueue();
      return true;
    } catch (err) {
      console.error('[NotificationRuleStore] Failed to schedule:', err);
      return false;
    }
  },

  cancelQueued: async (id) => {
    try {
      await API.delete(`/notification-rules/queue/${id}`);
      set((s) => ({
        queue: s.queue.map((q) =>
          q.id === id ? { ...q, status: 'CANCELLED' as const } : q
        ),
      }));
      return true;
    } catch (err) {
      console.error('[NotificationRuleStore] Failed to cancel:', err);
      return false;
    }
  },

  retryQueued: async (id) => {
    try {
      await API.post(`/notification-rules/queue/${id}/retry`);
      set((s) => ({
        queue: s.queue.map((q) =>
          q.id === id
            ? { ...q, status: 'PENDING' as const, retryCount: 0, errorLog: undefined }
            : q
        ),
      }));
      return true;
    } catch (err) {
      console.error('[NotificationRuleStore] Failed to retry:', err);
      return false;
    }
  },
}));
