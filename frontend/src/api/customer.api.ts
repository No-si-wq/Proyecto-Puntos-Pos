import http from "./http";
import type {
  Customer,
  CreateCustomerDTO,
  UpdateCustomerDTO,
} from "../types/customer";

export async function getCustomers() {
  const { data } = await http.get<Customer[]>("/customers");
  return data;
}

export async function getCustomer(id: number) {
  const { data } = await http.get<Customer>(`/customers/${id}`);
  return data;
}

export async function createCustomer(payload: CreateCustomerDTO) {
  const { data } = await http.post<Customer>("/customers", payload);
  return data;
}

export async function updateCustomer(
  id: number,
  payload: UpdateCustomerDTO
) {
  const { data } = await http.put<Customer>(
    `/customers/${id}`,
    payload
  );
  return data;
}

export async function toggleCustomerActive(
  id: number,
  active: boolean
) {
  await http.patch(`/customers/${id}/activate`, { active });
}
