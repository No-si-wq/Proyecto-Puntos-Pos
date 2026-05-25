export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
  SELLER = "SELLER",
}

export interface User {
  id: number;
  name: string;
  username: string;
  warehouse: { id: number, name: string }
  role: Role;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: Role;
}

export interface CreateUserDTO {
  name: string;
  password: string;
  username: string;
  warehouseId: number;
  role: Role;
}

export interface UpdateUserDTO {
  name?: string;
  role?: Role;
  username?: string;
  warehouseId?: number;
  active?: boolean;
}

export interface UsersResponse {
  data: User[];
  total: number;
}