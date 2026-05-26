import { useEffect, useState, useCallback } from "react";
import http from "../../core/http/http";
import type {
  Supplier,
  SupplierSearch,
  CreateSupplierDTO,
  UpdateSupplierDTO,
} from "./supplier";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<SupplierSearch>({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<Supplier[]>("/suppliers", {
        params: {
          search: filters.search,
          onlyInactive: filters.onlyInactive ? "true" : undefined,
        },
      });
      setSuppliers(data);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.onlyInactive]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(payload: CreateSupplierDTO) {
    setCreating(true);
    try {
      await http.post<Supplier>("/suppliers", payload);
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function update(id: number, payload: UpdateSupplierDTO) {
    await http.put<Supplier>(`/suppliers/${id}`, payload);
    await load();
  }

  async function toggleActive(id: number, active: boolean) {
    await http.patch(`/suppliers/${id}/activate`, { active });
    await load();
  }

  return {
    suppliers,
    loading,
    creating,
    filters,
    setFilters,
    reload: load,
    create,
    update,
    toggleActive,
  };
}