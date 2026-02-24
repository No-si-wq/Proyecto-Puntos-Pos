import http from "./http";
import type { 
  Purchase, 
  CreatePurchaseDTO,
} from "../types/purchase";

export async function getPurchases(params?: {
  from?: string;
  to?: string;
}) {
  const { data } = await http.get("/purchases", {params});
  return data;
}
export async function createPurchase(payload: CreatePurchaseDTO) {
  const { data } = await http.post<Purchase>("/purchases", payload);
  return data;
}