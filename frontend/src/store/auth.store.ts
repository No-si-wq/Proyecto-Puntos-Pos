import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../types/auth";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  activeWarehouseId?: number;

  setActiveWarehouse: (id: number | undefined) => void;

  login: (data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }) => void;

  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export function resolveDashboardRoute(role: string) {
  if (role === "ADMIN") return "/admin-dashboard";
  return "/dashboard";
}

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,
      activeWarehouseId: undefined,

      setActiveWarehouse: (id) =>
        set({ activeWarehouseId: id }),

      login: ({ user, accessToken, refreshToken }) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          activeWarehouseId: undefined,
        }),
    }),
    {
      name: "auth-store",
      version: 2,

      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        activeWarehouseId: state.activeWarehouseId,
      }),

      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
        }
      },
    }
  )
);