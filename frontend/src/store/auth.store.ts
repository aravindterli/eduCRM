import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Permissions = Record<string, { read: boolean; write: boolean; edit: boolean; delete: boolean }>;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  sector: string;
  theme: string;
  accent: string;
  customRoleName?: string | null;
  permissions?: Permissions | null;
  subscriptionStatus?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  tokenExpired: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setTokenExpired: (expired: boolean) => void;
  hasPermission: (module: string, action: 'read' | 'write' | 'edit' | 'delete') => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
      hasPermission: (module, action) => {
        const { user } = get();
        if (!user) return false;
        // admin and superadmin always have full access
        if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') return true;
        // if no custom role assigned, default to no access on restricted modules
        if (!user.permissions) return true; // fallback: allow if no permissions set yet
        return user.permissions[module]?.[action] === true;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
