import http from "./http";
import type { Warehouse, WarehouseFormValues } from "../types/warehouse";

export async function getWarehouses(): Promise<Warehouse[]> {
  const { data } = await http.get("/warehouses");
  return data;
}

export async function createWarehouse(
  payload: WarehouseFormValues
) {
  const { data } = await http.post("/warehouses", payload);
  return data;
}

export async function updateWarehouse(
  id: number,
  payload: WarehouseFormValues
) {
  const { data } = await http.patch(`/warehouses/${id}`, payload);
  return data;
}

export async function deleteWarehouse(id: number) {
  await http.delete(`/warehouses/${id}`);
}