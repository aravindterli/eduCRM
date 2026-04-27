import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  theme: string;
  accent: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  tokenExpired: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setTokenExpired: (expired: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tokenExpired: false,
      setAuth: (user, token) => {
        set({ user, token, tokenExpired: false });
        localStorage.setItem('centracrm_token', token);
      },
      logout: () => {
        set({ user: null, token: null, tokenExpired: false });
        localStorage.removeItem('centracrm_token');
      },
      setTokenExpired: (expired) => set({ tokenExpired: expired }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
