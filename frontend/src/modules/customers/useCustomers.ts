import { useEffect, useState, useCallback } from "react";
import http from "../../core/http/http"
import type {
  Customer,
  CustomerSearch,
  CreateCustomerDTO,
  UpdateCustomerDTO,
} from "./customer";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filters, setFilters] = useState<CustomerSearch>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<Customer[]>("/customers", {
        params: { 
          search: filters.search,
          onlyInactive: filters.onlyInactive ? "true" : undefined,
        },
      });
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.onlyInactive]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(payload: CreateCustomerDTO) {
    await http.post("/customers", payload);
    await load();
  }

  async function update(id: number, payload: UpdateCustomerDTO) {
    await http.put(`/customers/${id}`, payload);
    await load();
  }

  async function toggleActive(id: number, active: boolean) {
    await http.patch(`/customers/${id}/activate`, { active })
    await load();
  }

  return {
    customers,
    loading,
    filters,
    setFilters,
    reload: load,
    create,
    update,
    toggleActive,
  };
}