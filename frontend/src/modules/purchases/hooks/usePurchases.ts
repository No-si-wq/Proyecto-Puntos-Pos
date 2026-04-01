import { useEffect, useState, useCallback, useRef } from "react";
import { useRequiredWarehouse } from "../../warehouses/hooks/useRequiredWarehouse";
import http from "../../../core/http/http";
import type {
  Purchase,
  CreatePurchaseDTO,
} from "../types/purchase";

type UnitConversion = {
  fromUnit: string;
  fromUnitLabel: string;
  factor: number;
};

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [creating, setCreating] = useState(false);
  const [unitConversions, setUnitConversions] = useState<
    Record<number, UnitConversion[]>
  >({});
  const loadingConversionsRef = useRef<
    Partial<Record<number, Promise<UnitConversion[]>>>
  >({});
  const warehouseId = useRequiredWarehouse();

  const load = useCallback(async (filters?: {
    from?: string;
    to?: string;
  }) => {
    if (!warehouseId) return;

    setLoadingList(true);
    try {
      const { data } = await http.get("/purchases", { params: filters });
      setPurchases(data);
    } finally {
      setLoadingList(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function getPurchaseById(id: number | string): Promise<Purchase> {
    setLoadingDetail(true);
    try {
      const { data } = await http.get<Purchase>(`/purchases/${id}`);
      return data;
    } finally {
      setLoadingDetail(false);
    }
  }

  async function create(payload: CreatePurchaseDTO) {
    setCreating(true);
    try {
      await http.post<Purchase>("/purchases", payload)
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function loadUnitConversions(productId: number) {
    if (unitConversions[productId]) {
      return unitConversions[productId];
    }

    if (loadingConversionsRef.current[productId]) {
      return loadingConversionsRef.current[productId];
    }

    const request = http
      .get<UnitConversion[]>(`/inventory/conversions/${productId}`)
      .then(({ data }) => {
        setUnitConversions((prev) => ({ ...prev, [productId]: data }));
        return data;
      })
      .catch(() => {
        setUnitConversions((prev) => ({ ...prev, [productId]: [] }));
        return [];
      })
      .finally(() => {
        delete loadingConversionsRef.current[productId];
      });

    loadingConversionsRef.current[productId] = request;
    return request;
  }

  return {
    purchases,
    loadingList,
    loadingDetail,
    creating,
    reload: load,
    getPurchaseById,
    create,
    unitConversions,
    loadUnitConversions,
  };
}
