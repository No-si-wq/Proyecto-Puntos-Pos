import { useState, useCallback } from "react";
import { message } from "antd";
import http from "../../../core/http/http";
import type { TransferWarehousePayload } from "../types/inventory";

export function useTransferWarehouse(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);

  const transfer = useCallback(async (payload: TransferWarehousePayload) => {
    setLoading(true);
    try {
      await http.post("/inventory/transfer-warehouse", payload);
      message.success("Traslado de bodega realizado con éxito");
      onSuccess?.();
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Error al realizar el traslado";
      message.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { transfer, loading };
}