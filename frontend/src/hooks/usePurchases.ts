import { useEffect, useState, useCallback } from "react";
import { useRequiredWarehouse } from "./useRequiredWarehouse";
import {
  getPurchases,
  createPurchase
} from "../api/purchase.api";
import type {
  Purchase,
  CreatePurchaseDTO,
} from "../types/purchase";

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
      setPurchases(await getPurchases(filters));
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
      await createPurchase(payload);
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