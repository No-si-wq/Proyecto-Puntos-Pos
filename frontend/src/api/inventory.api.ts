import http from "./http";
import type { ExpiringAlert } from "../types/alert";

export async function getStock(
  productId: number,
) {
  const { data } = await http.get<{
    productId: number;
    stock: number;
  }>(
    `/inventory/${productId}/stock`
  );

  return data;
}

export async function getInventoryList(params: {
  search?: string;
}) {
  const { data } = await http.get("/inventory", {
    params: {
      search: params.search,
    },
  });

  return data;
}

export async function getInventoryLots(
  productId: number
) {
  const { data } = await http.get<
    {
      id: number;
      quantity: number;
      cost: number;
      expiresAt: string | null;
      purchase: {
        id: number;
        createdAt: string;
      };
    }[]
  >(`/inventory/${productId}/lots`);

  return data;
}

export async function getExpiringInventory(
  days = 60,
) {
  const { data } = await http.get<ExpiringAlert[]>(
    "/inventory/expiring",
    {
      params: {
        days,
      },
    }
  );

  return data;
}