import { useState, useCallback, useEffect } from "react";
import { message } from "antd";
import http from "../../../core/http/http";
import { Dayjs } from "dayjs";
import type { CommissionRow } from "../types/commission";

export function useCommissionReport() {
  const [data, setData] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (dates?: [Dayjs, Dayjs] | null) => {
    setLoading(true);
    try {
      const params: Record<string, string>= {};
      if (dates) {
        params.from = dates[0].startOf("day").toISOString();
        params.to = dates[1].endOf("day").toISOString();
      }
      const { data: rows } = await http.get<CommissionRow[]>("/commissions/reports", { params });
      setData(rows);
    } catch {
      message.error("Error al cargar el reporte de comisiones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, fetch };
}