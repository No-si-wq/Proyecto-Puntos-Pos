import http from "./http";
import type { Sale, CreateSaleDTO } from "../types/sale";

export async function getSales(params?: {
  from?: string;
  to?: string;
}) {
  const { data } = await http.get("/sales", {params});
  return data;
}

export async function getSale(id: number) {
  const { data } = await http.get<Sale>(`/sales/${id}`);
  return data;
}

export async function createSale(payload: CreateSaleDTO) {
  const { data } = await http.post<Sale>("/sales", payload);
  return data;
}

export async function cancelSale(id: number) {
  await http.post(`/sales/${id}/cancel`);
}