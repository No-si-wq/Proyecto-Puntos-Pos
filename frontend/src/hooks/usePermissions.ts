import { useMemo } from "react";
import { authStore } from "../store/auth.store";
import { Role } from "../types/user";

export function usePermissions() {
  const { user } = authStore();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        role: null,
        isAdmin: false,
        isUser: false,
        canAccess: () => false,
      };
    }

    const isAdmin = user.role === Role.ADMIN;
    const isUser = user.role === Role.USER;

    const canAccess = (...allowedRoles: Role[]) => {
      if (allowedRoles.length === 0) return true;
      return allowedRoles.includes(user.role);
    };

    return {
      role: user.role,
      isAdmin,
      isUser,
      canAccess,
    };
  }, [user]);

  return permissions;
}