import { Role } from "@prisma/client";

export interface RequestUser {
  id: number;
  username: string;
  tenantId: number;
  warehouseId: number;
  role: Role;
}

export enum AuthError {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  USER_INACTIVE = "USER_INACTIVE",
  TOKEN_REVOKED = "TOKEN_REVOKED",
  USER_DISABLED = "USER_DISABLED",
  TENANT_DISABLED = "TENANT_DISABLED",
}