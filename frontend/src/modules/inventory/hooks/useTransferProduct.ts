import { useState, useCallback } from "react";
import { message } from "antd";
import http from "../../../core/http/http";

export interface TransferProductPayload {
  fromProductId: number;
  toProductId: number;
  warehouseId: number;
  quantity: number;       
  factor: number;        
}

export function useTransferProduct() {
  const [loading, setLoading] = useState(false);

  const transfer = useCallback(async (payload: TransferProductPayload) => {
    setLoading(true);
    try {
      await http.post("/inventory/transfer-product", payload);
      message.success("Transferencia realizada con éxito");
      return true;
    } catch (err: any) {
      console.log("Error capturado:", err);
      const msg =
        err?.response?.data?.message ?? "Error al realizar la transferencia";
      message.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { transfer, loading };
}