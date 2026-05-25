import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Role } from "../../core/auth/roles"
import type { AuthUser } from "./auth";

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
    warehouseId: number,
    accessToken: string;
    refreshToken: string;
  }) => void;

  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export function resolveDashboardRoute(role: string): string {
  if (role === Role.ADMIN) return "/admin-dashboard";
  if (role === Role.USER) return "/dashboard";
  if (role === Role.SELLER) return "/sales";
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

      login: ({ user, accessToken, refreshToken, warehouseId }) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          activeWarehouseId: warehouseId ?? undefined,
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
      version: 3,

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
