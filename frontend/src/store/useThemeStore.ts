import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/utils/api';

export type ThemeType = 'ocean' | 'slate' | 'light';
export type AccentType = 'blue' | 'indigo' | 'emerald' | 'rose' | 'purple' | 'violet' | 'pink' | 'fuchsia' | 'cyan' | 'teal' | 'lime' | 'amber' | 'orange' | 'red' | 'yellow' | 'slate' | 'gray' | 'zinc';

interface ThemeState {
  theme: ThemeType;
  accent: AccentType;
  setTheme: (theme: ThemeType) => void;
  setAccent: (accent: AccentType) => void;
  syncWithUser: (userData: { theme?: string; accent?: string }) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'ocean',
      accent: 'blue',
      setTheme: (theme) => {
        set({ theme });
        api.patch('/auth/profile', { theme }).catch(() => {});
      },
      setAccent: (accent) => {
        set({ accent });
        api.patch('/auth/profile', { accent }).catch(() => {});
      },
      syncWithUser: (userData) => {
        if (userData.theme) set({ theme: userData.theme as ThemeType });
        if (userData.accent) set({ accent: userData.accent as AccentType });
      },
    }),
    {
      name: 'educrm-theme-storage',
    }
  )
);
