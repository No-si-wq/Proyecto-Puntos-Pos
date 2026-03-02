import { useState } from "react";
import { getKardex, getProfitReport } from "../api/report.api";
import { useRequiredWarehouse } from "./useRequiredWarehouse";
import type {
  ProfitDetail,
  ProfitSummary,
} from "../types/report";

export function useReports() {
  const warehouseId = useRequiredWarehouse();
  const [loading, setLoading] = useState(false);

  const fetchKardex = async (params: {
    productId: number;
    from: string;
    to: string;
    page: number;
    pageSize: number;
  }) => {
    if (!warehouseId) return null;
    

    setLoading(true);
    try {
      const { data } = await getKardex({
        ...params,
        warehouseId,
      });

      return data;
    } finally {
      setLoading(false);
    }
  };

  const fetchProfit = async (params: {
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
      const { data } = await getProfitReport({
        ...params,
        warehouseId,
      });

      return data;
    } finally {
      setLoading(false);
    }
  };

  return { fetchKardex, fetchProfit, loading };
}