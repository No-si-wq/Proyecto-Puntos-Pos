import { useEffect, useState } from "react";
import http from "../../core/http/http";
import type { Warehouse, WarehouseFormValues } from "./warehouse";

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await http.get("/warehouses");
      setWarehouses(data);
    } finally {
      setLoading(false);
    }
  }

  async function create(payload: WarehouseFormValues) {
    await http.post("/warehouses", payload);
    await load();
  }

  async function update(id: number, payload: WarehouseFormValues) {
    await http.put(`/warehouses/${id}`, payload);
    await load();
  }

  async function remove(id: number) {
    await http.delete(`/warehouses/${id}`);
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