import { useState, useCallback, useRef, useEffect } from "react";
import { message } from "antd";
import { useRequiredWarehouse } from "../warehouses/hooks/useRequiredWarehouse";
import http from "../../core/http/http";

import type {
  ProfitDetail,
  ProfitSummary,
  PurchaseLotReportItem,
  SoldProductRow,
  ProductOutputRow,
  GeneralInventoryRow,
} from "./report";

export function useReports() {
  const warehouseId = useRequiredWarehouse();

  const [purchaseLots, setPurchaseLots] = useState<PurchaseLotReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [soldProducts, setSoldProducts] = useState<SoldProductRow[]>([]);
  const [productOutputs, setProductOutputs] = useState<ProductOutputRow[]>([]);
  const [generalInventory, setGeneralInventory] = useState<GeneralInventoryRow[]>([]);

  const fetchPurchaseLots = useCallback(
    async (filters?: { product?: string }) => {
      if (!warehouseId) return;

      setLoading(true);
      try {
        const { data } = await http.get<PurchaseLotReportItem[]>(
          "/reports/purchase",
          { params: filters }
        );

        setPurchaseLots(data);
      } catch {
        message.error("Error cargando reporte de compras");
      } finally {
        setLoading(false);
      }
    },
    [warehouseId]
  );

  useEffect(() => {
    fetchPurchaseLots();
  }, [fetchPurchaseLots])

  const abortRef = useRef<AbortController | null>(null);

  const fetchKardex = useCallback(
    async (params: {
      productId: number;
      from: string;
      to: string;
      pageSize: number;
      cursor?: {
        createdAt: string;
        id: string;
      };
    }) => {

      if (!warehouseId) return null;

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      try {

        const queryParams: any = {
          warehouseId,
          productId: params.productId,
          from: params.from,
          to: params.to,
          pageSize: params.pageSize
        };

        if (params.cursor) {
          queryParams.cursorCreatedAt = params.cursor.createdAt;
          queryParams.cursorId = params.cursor.id;
        }

        const { data } = await http.get("/reports/kardex", {
          params: queryParams,
          signal: controller.signal
        });

        return data;

      } catch (err: any) {

        if (err.name === "CanceledError" || err.name === "AbortError") {
          return null;
        }

        throw err;

      } finally {

        if (!controller.signal.aborted) {
          setLoading(false);
        }

      }

    },
    [warehouseId]
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const fetchProfit = useCallback(
    async (params: {
      from: string;
      to: string;
    }): Promise<{
      summary: ProfitSummary[];
      details: ProfitDetail[];
    }> => {
      if (!warehouseId) {
        return {
          summary: [],
          details: [],
        };
      }

      setLoading(true);
      try {
        const { data } = await http.get("/reports/profit", { params });
        return data;
      } finally {
        setLoading(false);
      }
    },
    [warehouseId]
  );

  const fetchSoldProducts = useCallback(
    async (params: { from: string; to: string; warehouseId?: number }) => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          from: params.from,
          to: params.to,
          ...(params.warehouseId ? { warehouseId: String(params.warehouseId) } : {}),
        });
        const res = await http.get<SoldProductRow[]>(`/reports/sold-products?${query}`);
        setSoldProducts(res.data);
      } finally {
        setLoading(false);
      }
    },
    [warehouseId]
  );

  const fetchProductOutputs = useCallback(
    async (params: { from: string; to: string }) => {
      if (!warehouseId) return;
      setLoading(true);
      try {
        const { data } = await http.get<ProductOutputRow[]>("/reports/product-outputs", {
          params,
        });
        setProductOutputs(data);
      } finally {
        setLoading(false);
      }
    },
    [warehouseId]
  );

  const fetchGeneralInventory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<GeneralInventoryRow[]>("/reports/general-inventory");
      setGeneralInventory(data);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    purchaseLots,
    loading,
    soldProducts,
    generalInventory,
    productOutputs,

    fetchPurchaseLots,
    fetchKardex,
    fetchProfit,
    fetchSoldProducts,
    fetchGeneralInventory,
    fetchProductOutputs,

    clearSoldProducts: () => setSoldProducts([]),
    clearProductOutputs: () => setProductOutputs([]),
    clearGeneralInventory: () => setGeneralInventory([]),
  };
}