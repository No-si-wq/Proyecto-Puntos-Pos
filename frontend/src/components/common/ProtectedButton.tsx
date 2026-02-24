import { Button, type ButtonProps } from "antd";
import type { ReactNode } from "react";
import { Role } from "../../types/user";
import { usePermissions } from "../../hooks/usePermissions";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";

interface ProtectedButtonProps extends ButtonProps {
  roles?: Role[];

  disabledFallback?: boolean;

  children: ReactNode;
}

export default function ProtectedButton({
  roles = [],
  disabledFallback = false,
  children,
  ...buttonProps
}: ProtectedButtonProps) {
  const { canAccess } = usePermissions();
  const sizes = useResponsiveSizes();

  const hasPermission = canAccess(...roles);

  if (!hasPermission && !disabledFallback) {
    return null;
  }

  return (
    <Button
      {...buttonProps}
      size={sizes.button}
      disabled={!hasPermission || buttonProps.disabled}
    >
      {children}
    </Button>
  );
}