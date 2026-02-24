import { useEffect, useState } from "react";
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "../api/warehouse.api";
import type { Warehouse, WarehouseFormValues } from "../types/warehouse";

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getWarehouses();
      setWarehouses(data);
    } finally {
      setLoading(false);
    }
  }

  async function create(data: WarehouseFormValues) {
    await createWarehouse(data);
    await load();
  }

  async function update(id: number, data: WarehouseFormValues) {
    await updateWarehouse(id, data);
    await load();
  }

  async function remove(id: number) {
    await deleteWarehouse(id);
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return {
    warehouses,
    loading,
    create,
    update,
    remove,
  };
}