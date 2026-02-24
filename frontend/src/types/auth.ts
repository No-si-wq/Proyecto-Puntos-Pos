import { Role } from "./user";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  name: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}