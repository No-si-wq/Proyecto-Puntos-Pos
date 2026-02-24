import { useEffect, useState, useCallback } from "react";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
} from "../api/supplier.api";
import type {
  Supplier,
  CreateSupplierDTO,
  UpdateSupplierDTO,
} from "../types/supplier";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSuppliers(await getSuppliers());
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
      await createSupplier(payload);
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function update(id: number, payload: UpdateSupplierDTO) {
    await updateSupplier(id, payload);
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