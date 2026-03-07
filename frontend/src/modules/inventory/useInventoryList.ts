import { useEffect, useState, useCallback } from "react";
import { useRequiredWarehouse } from "../warehouses/useRequiredWarehouse";
import http from "../../core/http/http";

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
      const { data } = await http.get("/inventory",{ 
        params: {search: filters.search} 
      });

      setData(data);
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