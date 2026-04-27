import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { notificationService } from '@/services/notification.service';

export interface AppNotification {
  id: string;
  taskId: string;
  title: string;
  message: string;
  type: 'FOLLOW_UP' | 'SYSTEM';
  createdAt: string;
  isRead: boolean;
  leadId?: string;
  scheduledAt?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  socket: Socket | null;
  token: string | null;
  
  // Actions
  init: (userId: string, token: string | null) => void;
  fetchNotifications: (tokenOverride?: string | null) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  disconnect: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,
  token: null,

  init: (userId, token) => {
    if (get().socket) return; // Already initialized

    set({ token });

    const newSocket = io(SOCKET_URL, {
      auth: { token: token || localStorage.getItem('token') },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to real-time server');
    });

    newSocket.on('new-notification', (notification: AppNotification) => {
      console.log('[Socket] New alert received:', notification);
      set((state) => ({
        notifications: [notification, ...state.notifications].slice(0, 50),
        unreadCount: state.unreadCount + 1
      }));
      
      // Native Browser Notification
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png' // Adjust if you have a public logo
        });
      }
    });

    set({ socket: newSocket });
    get().fetchNotifications(token);
  },

  fetchNotifications: async (tokenOverride) => {
    try {
      const activeToken = tokenOverride || get().token;
      if (!activeToken && !localStorage.getItem('token')) return;

      const data = await notificationService.getAll(activeToken);
      const unread = data.filter((n: any) => !n.isRead).length;
      set({ notifications: data, unreadCount: unread });
    } catch (err: any) {
      if (err.response?.status === 401) return;
      console.error('[NotificationStore] Fetch failed:', err);
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationService.markAsRead(id, get().token);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('[NotificationStore] Mark read failed:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllRead(get().token);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('[NotificationStore] Mark all read failed:', err);
    }
  },

  removeNotification: async (id) => {
    try {
      await notificationService.delete(id, get().token);
      set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: notification && !notification.isRead ? state.unreadCount - 1 : state.unreadCount
        };
      });
    } catch (err) {
      console.error('[NotificationStore] Delete failed:', err);
    }
  },

  clearAll: async () => {
    try {
      await notificationService.clearAll(get().token);
      set({ notifications: [], unreadCount: 0 });
    } catch (err) {
      console.error('[NotificationStore] Clear all failed:', err);
    }
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  }
}));
