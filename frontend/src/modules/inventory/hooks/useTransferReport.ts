import { useState, useCallback } from "react";
import { message } from "antd";
import http from "../../../core/http/http";
import { useRequiredWarehouse } from "../../warehouses/hooks/useRequiredWarehouse";
import type { TransferReportItem, Filters } from "../types/inventory";

export function useTransferReport() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TransferReportItem[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const warehouseId = useRequiredWarehouse();

  const load = useCallback(async (currentFilters: Filters) => {
    if (!warehouseId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("warehouseId", String(warehouseId));
      if (currentFilters.productId) params.set("productId", String(currentFilters.productId));
      if (currentFilters.from) params.set("from", currentFilters.from);
      if (currentFilters.to)   params.set("to", currentFilters.to);

      const { data: result } = await http.get<TransferReportItem[]>(
        `/inventory/transfers/report?${params.toString()}`
      );
      setData(result);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Error al obtener el reporte";
      message.error(msg);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  return { data, loading, filters, setFilters, search: () => load(filters) };
}