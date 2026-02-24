import { useEffect, useState, useCallback } from "react";
import { useRequiredWarehouse } from "./useRequiredWarehouse";
import {
  getSales,
  createSale,
  cancelSale,
} from "../api/sale.api";
import type { Sale, CreateSaleDTO } from "../types/sale";

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
      setSales(await getSales(filters));
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
      const sale = await createSale(payload);
      await load();
      return sale;
    } finally {
      setCreating(false);
    }
  }

  async function cancel(id: number) {
    setCanceling(true);
    try {
      await cancelSale(id);
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