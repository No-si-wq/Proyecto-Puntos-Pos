import { Role } from "../../core/auth/roles";

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  warehouseId: number;
  user: AuthUser;
}