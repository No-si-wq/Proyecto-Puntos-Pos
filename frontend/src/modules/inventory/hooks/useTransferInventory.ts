import { useState, useCallback } from "react";
import { message } from "antd";
import http from "../../../core/http/http";
import type { TransferPayload } from "../types/inventory";

export function useTransferInventory(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);

  const transfer = useCallback(async (payload: TransferPayload) => {
    setLoading(true);
    try {
      await http.post("/inventory/transfer", payload);
      message.success("Transferencia realizada con éxito");
      onSuccess?.();
      return true;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Error al realizar la transferencia";
      message.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { transfer, loading };
}