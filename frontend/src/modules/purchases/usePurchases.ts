import { useEffect, useState, useCallback } from "react";
import { useRequiredWarehouse } from "../warehouses/useRequiredWarehouse";
import http from "../../core/http/http";
import type {
  Purchase,
  CreatePurchaseDTO,
} from "./purchase";

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);
  const warehouseId = useRequiredWarehouse();

  const load = useCallback(async (filters?: {
    from?: string;
    to?: string;
  }) => {
    if (!warehouseId) return;

    setLoadingList(true);
    try {
      const { data } = await http.get("/purchases", { params: { filters } } );
      setPurchases(data);
    } finally {
      setLoadingList(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(payload: CreatePurchaseDTO) {
    setCreating(true);
    try {
      await http.post<Purchase>("/purchases", payload)
      await load();
    } finally {
      setCreating(false);
    }
  }

  return {
    purchases,
    loadingList,
    creating,
    reload: load,
    create,
  };
}