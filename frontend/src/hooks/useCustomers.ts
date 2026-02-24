import { useEffect, useState, useCallback } from "react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  toggleCustomerActive,
} from "../api/customer.api";
import type {
  Customer,
  CreateCustomerDTO,
  UpdateCustomerDTO,
} from "../types/customer";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCustomers(await getCustomers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(payload: CreateCustomerDTO) {
    await createCustomer(payload);
    await load();
  }

  async function update(id: number, payload: UpdateCustomerDTO) {
    await updateCustomer(id, payload);
    await load();
  }

  async function toggleActive(id: number, active: boolean) {
    await toggleCustomerActive(id, active);
    await load();
  }

  return {
    customers,
    loading,
    reload: load,
    create,
    update,
    toggleActive,
  };
}