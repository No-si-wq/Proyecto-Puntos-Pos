import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import { getAdminDashboard } from "../api/dashboard.api";
import type { AdminDashboardData } from "../types/dashboard";

interface UseAdminDashboardOptions {
  from?: Date;
  to?: Date;
  autoLoad?: boolean;
}

export function useAdminDashboard(
  options?: UseAdminDashboardOptions
) {
  const { from, to, autoLoad = true } = options || {};

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getAdminDashboard({
        from: from ? dayjs(from).toISOString() : undefined,
        to: to ? dayjs(to).toISOString() : undefined,
      });

      setData(result);
    } catch (e: any) {
      message.error(
        e.response?.data?.message ??
        "Error cargando dashboard administrativo"
      );
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [load, autoLoad]);

  return {
    data,
    loading,
    reload: load,
    hasData: !!data,
  };
}