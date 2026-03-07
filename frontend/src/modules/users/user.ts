export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface User {
  id: number;
  email: string;
  name: string;
  username: string;
  role: Role;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  name: string;
  role: Role;
}

export interface CreateUserDTO {
  email: string;
  name: string;
  password: string;
  username: string;
  role: Role;
}

export interface UpdateUserDTO {
  email?: string;
  name?: string;
  role?: Role;
  username?: string;
  active?: boolean;
}

export interface UsersResponse {
  data: User[];
  total: number;
}