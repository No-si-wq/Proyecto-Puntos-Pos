import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { authStore } from "../store/auth.store";
import { usePermissions } from "../hooks/usePermissions";
import {
  type PermissionModule,
  type PermissionAction,
  getAllowedRoles,
} from "../utils/permissions";

interface ProtectedRouteProps {
  children: ReactNode;
  module?: PermissionModule;
  action?: PermissionAction;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  module,
  action = "view",
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const user = authStore((state) => state.user);

  const { canAccess } = usePermissions();

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (module) {
    const allowedRoles = getAllowedRoles(module, action);

    if (!canAccess(...allowedRoles)) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
}