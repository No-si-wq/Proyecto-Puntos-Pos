import { useEffect, useState, useCallback } from "react";
import http from "../../core/http/http";
import type {
  Supplier,
  CreateSupplierDTO,
  UpdateSupplierDTO,
} from "./supplier";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<Supplier[]>("/suppliers");
      setSuppliers(data);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return {
    suppliers,
    loading,
    creating,
    reload: load,
    create,
    update,
  };
}