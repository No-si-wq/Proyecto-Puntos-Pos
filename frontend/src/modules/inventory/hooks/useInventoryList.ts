import { useEffect, useState, useCallback } from "react";
import { useRequiredWarehouse } from "../../warehouses/hooks/useRequiredWarehouse";
import http from "../../../core/http/http";
import type { Lot, AdjustPayload, AdjustResult, InventorySummary } from "../types/inventory";

interface Filters {
  search?: string;
}

export function useInventoryList() {
  const [data, setData] = useState<InventorySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const warehouseId = useRequiredWarehouse();

  const load = useCallback(async () => {
    if (!warehouseId) return;
    setLoading(true);
    try {
      const { data } = await http.get("/inventory", {
        params: { search: filters.search },
      });
      setData(data);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters.search, warehouseId]);

  useEffect(() => {
    load();
  }, [load]);
  
  const fetchAllLots = useCallback(async (): Promise<Record<number, Lot[]>> => {
    try {
      const { data } = await http.get<Record<number, Lot[]>>("/inventory/lots/all");
      await load();
      return data;
    } catch {
      return {};
    }
  }, []);

  const adjustInventory = useCallback(async (payload: AdjustPayload): Promise<AdjustResult> => {
    const { data } = await http.post<AdjustResult>("/inventory/adjust", payload);
    return data;
  }, []);

  return {
    data,
    loading,
    filters,
    setFilters,
    reload: load,
    fetchAllLots,
    adjustInventory
  };
}