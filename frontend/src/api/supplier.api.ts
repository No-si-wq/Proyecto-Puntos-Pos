import http from "./http";
import type {
  Supplier,
  CreateSupplierDTO,
  UpdateSupplierDTO,
} from "../types/supplier";

export async function getSuppliers() {
  const { data } = await http.get<Supplier[]>("/suppliers");
  return data;
}

export async function getSupplier(id: number) {
  const { data } = await http.get<Supplier>(`/suppliers/${id}`);
  return data;
}

export async function createSupplier(payload: CreateSupplierDTO) {
  const { data } = await http.post<Supplier>("/suppliers", payload);
  return data;
}

export async function updateSupplier(
  id: number,
  payload: UpdateSupplierDTO
) {
  const { data } = await http.put<Supplier>(
    `/suppliers/${id}`,
    payload
  );
  return data;
}