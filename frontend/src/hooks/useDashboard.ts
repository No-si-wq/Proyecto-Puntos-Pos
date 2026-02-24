import { useEffect, useState, useRef, useTransition } from "react";
import { getDashboard } from "../api/dashboard.api";
import { useRequiredWarehouse } from "./useRequiredWarehouse";
import type { DashboardData } from "../types/dashboard";

type Status = "idle" | "loading" | "success" | "error";

export function useDashboard() {
  const warehouseId = useRequiredWarehouse();
  const hasWarehouse = Boolean(warehouseId);

  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, startTransition] = useTransition();

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!warehouseId) {
      setData(null);
      setStatus("idle");
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    const load = async () => {
      setStatus("loading");

      try {
        const result = await getDashboard();

        startTransition(() => {
          if (requestIdRef.current === currentRequestId) {
            setData(result);
            setStatus("success");
          }
        });
      } catch {
        if (requestIdRef.current === currentRequestId) {
          setStatus("error");
        }
      }
    };

    load();
  }, [warehouseId]);

  return {
    data,
    status,
    isPending,
    hasWarehouse,
  };
}