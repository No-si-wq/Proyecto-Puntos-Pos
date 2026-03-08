import { useEffect, useState } from "react";
import http from "../../core/http/http";
import type { Warehouse, CreateWareHouseDTO, UpdateWareHouseDTO } from "./warehouse";

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

  async function create(payload: CreateWareHouseDTO) {
    await http.post("/warehouses", payload);
    await load();
  }

  async function update(id: number, payload: UpdateWareHouseDTO) {
    await http.put(`/warehouses/${id}`, payload);
    await load();
  }

  async function toggleActive(id: number, active: boolean) {
    await http.patch(`/warehouses/${id}/activate`, { active });
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
    toggleActive,
  };
}