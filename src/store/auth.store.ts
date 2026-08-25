import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthRole {
  code: string;
  name: string;
  category: string;
  scope_type: string;
  scope_id: string | null;
}

interface AuthUser {
  full_name: string;
  email: string;
  account_status: string;
  [key: string]: unknown;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  permissions: string[];
  roles: AuthRole[];
  isAuthenticated: boolean;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setPermissions: (permissions: string[]) => void;
  setRoles: (roles: AuthRole[]) => void;
  hasPermission: (code: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      permissions: [],
      roles: [],
      isAuthenticated: false,
      setSession: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user, permissions: [], roles: [], isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setPermissions: (permissions) => set({ permissions }),
      setRoles: (roles) => set({ roles }),
      hasPermission: (code) => get().permissions.includes(code),
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, permissions: [], roles: [], isAuthenticated: false }),
    }),
    { name: 'tecump-auth' }
  )
);
