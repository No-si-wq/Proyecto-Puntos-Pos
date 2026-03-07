import { useState, useCallback, useRef, useEffect } from "react";
import { message } from "antd";
import { useRequiredWarehouse } from "../warehouses/useRequiredWarehouse";
import http from "../../core/http/http";

import type {
  ProfitDetail,
  ProfitSummary,
  PurchaseLotReportItem,
} from "./report";

export function useReports() {
  const warehouseId = useRequiredWarehouse();

  const [purchaseLots, setPurchaseLots] = useState<PurchaseLotReportItem[]>([]);
  const [loading, setLoading] = useState(false);

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
      summary: ProfitSummary;
      details: ProfitDetail[];
    }> => {
      if (!warehouseId) {
        return {
          summary: {
            totalSales: 0,
            totalCogs: 0,
            totalProfit: 0,
            margin: 0,
          },
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

  return {
    purchaseLots,
    loading,

    fetchPurchaseLots,
    fetchKardex,
    fetchProfit,
  };
}