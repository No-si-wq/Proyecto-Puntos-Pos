import { Role } from "@prisma/client";

export interface RequestUser {
  id: number;
  username: string;
  role: Role;
}

export enum AuthError {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  USER_INACTIVE = "USER_INACTIVE",
  TOKEN_REVOKED = "TOKEN_REVOKED",
}