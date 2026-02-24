import http from "./http";
import type { LoginResponse } from "../types/auth";

export async function login(username: string, password: string) {
  const { data } = await http.post<LoginResponse>("/auth/login", {
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