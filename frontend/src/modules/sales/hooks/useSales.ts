import { useEffect, useState, useCallback } from "react";
import { useRequiredWarehouse } from "../../warehouses/hooks/useRequiredWarehouse";
import http from "../../../core/http/http";
import type { Sale, CreateSaleDTO, ReturnSaleDTO, SaleReturn } from "../types/sale";

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [creating, setCreating] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [returning, setReturning] = useState(false);
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

  async function getSaleById(id: number | string): Promise<Sale> {
    setLoadingDetail(true);
    try {
      const { data } = await http.get<Sale>(`/sales/${id}`);
      return data;
    } finally {
      setLoadingDetail(false);
    }
  }

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

  async function returnItems(id: number, payload: ReturnSaleDTO): Promise<SaleReturn> {
    setReturning(true);
    try {
      const { data } = await http.post<SaleReturn>(`/sales/${id}/return`, payload);
      return data;
    } finally {
      setReturning(false);
    }
  }

  return {
    sales,
    loadingList,
    loadingDetail,
    creating,
    canceling,
    reload: load,
    getSaleById,
    create,
    cancel,
    returning,
    returnItems,
  };
}