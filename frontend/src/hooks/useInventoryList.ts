import { useEffect, useState, useCallback } from "react";
import { getInventoryList } from "../api/inventory.api";
import { useRequiredWarehouse } from "./useRequiredWarehouse";

export interface InventorySummary {
  id: number;
  sku: string;
  name: string;
  stock: number;
  active: boolean;
}

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
      const result = await getInventoryList({ search: filters.search });

      setData(result);
    } catch (error) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters.search, warehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    filters,
    setFilters,
    reload: load,
  };
}