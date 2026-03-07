import { useEffect, useState, useCallback } from "react";
import { useRequiredWarehouse } from "../warehouses/useRequiredWarehouse";
import http from "../../core/http/http";
import type { Sale, CreateSaleDTO } from "./sale";

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const warehouseId = useRequiredWarehouse();

  const load = useCallback(async (filters?: {
    from?: string;
    to?: string;
  }) => {
    if (!warehouseId) return;

    setLoadingList(true);
    try {
      const { data } = await http.get("/sales", { params: filters } );
      setSales(data);
    } finally {
      setLoadingList(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(payload: CreateSaleDTO) {
    setCreating(true);
    try {
      const { data } = await http.post<Sale>("/sales", payload);
      await load();
      return data;
    } finally {
      setCreating(false);
    }
  }

  async function cancel(id: number) {
    setCanceling(true);
    try {
      await http.post(`/sales/${id}/cancel`);
      await load();
    } finally {
      setCanceling(false);
    }
  }

  return {
    sales,
    loadingList,
    creating,
    canceling,
    reload: load,
    create,
    cancel,
  };
}