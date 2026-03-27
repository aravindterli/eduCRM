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
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token });
        localStorage.setItem('educrm_token', token);
      },
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('educrm_token');
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
