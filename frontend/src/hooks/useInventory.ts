import { useEffect, useState, useCallback } from "react";
import { useRequiredWarehouse } from "./useRequiredWarehouse";
import { getProduct } from "../api/product.api";
import {
  getStock,
  getInventoryLots,
} from "../api/inventory.api";

export function useInventory(
  productId?: number,
) {
  const [stock, setStock] = useState<number>(0);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState<string>("");
  const warehouseId = useRequiredWarehouse();

  const load = useCallback(async () => {
    if (!productId || !warehouseId) {
      setStock(0);
      setLots([]);
      return;
    }

    setLoading(true);
    try {
      const [ stockRes, lotRes, productRes ] =
        await Promise.all([
          getStock(productId),
          getInventoryLots(productId),
          getProduct(productId),
        ]);
      
      setStock(stockRes.stock);
      setLots(lotRes);
      setProductName(productRes.name);
    } finally {
      setLoading(false);
    }
  }, [productId, warehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    stock,
    lots,
    loading,
    productName,
    reload: load,
  };
}