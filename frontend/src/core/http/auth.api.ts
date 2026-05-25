import http from "./http";
import type { LoginResponse } from "../../modules/auth/auth";

export async function login(
  slug: string,
  username: string,
  password: string,
) {
  const { data } = await http.post<LoginResponse>("/auth/login", {
    slug,
    username,
    password,
  });
  return data;
}

export async function refresh(refreshToken: string) {
  const { data } = await http.post<{
    accessToken: string;
    refreshToken: string;
  }>("/auth/refresh", { refreshToken });

  return data;
}

export async function logout() {
  return http.post("/auth/logout");
}

export async function logoutGlobal() {
  return http.post("/auth/logout-global");
}

export interface RegisterTenantPayload {
  inviteCode: string;
  company: {
    name: string;
    slug: string;
  };
  admin: {
    username: string;
    password: string;
    confirmPassword: string;
    name?: string;
  };
}

export interface RegisterTenantResponse {
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
  user: LoginResponse["user"];
  accessToken: string;
  refreshToken: string;
}

export async function registerTenant(payload: RegisterTenantPayload) {
  const { data } = await http.post<RegisterTenantResponse>(
    "/tenants/register",
    payload
  );
  return data;
}