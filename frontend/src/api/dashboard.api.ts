import http from "./http";
import type { AdminDashboardData } from "../types/dashboard";

export async function getDashboard() {
  const { data } = await http.get("/dashboard");
  return data;
}

export async function getAdminDashboard(params?: {
  from?: string;
  to?: string;
}) {
  const { data } = await http.get<AdminDashboardData>(
    "/dashboard/admin",
    { params }
  );

  return data;
}