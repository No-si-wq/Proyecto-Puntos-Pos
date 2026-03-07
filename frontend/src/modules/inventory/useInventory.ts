import { useEffect, useState, useCallback } from "react";
import { useRequiredWarehouse } from "../warehouses/useRequiredWarehouse";
import http from "../../core/http/http";
import type { Product } from "../products/product";
import type { Lot } from "./Inventory";

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
      const [ productRes, stockRes, lotRes ] =
        await Promise.all([
          http.get<Product>(`/products/${productId}`),
          http.get<{ stock: number, }>(`/inventory/${productId}/stock`),
          http.get<Lot[]>(`/inventory/${productId}/lots`),
        ]);
      
      setProductName(productRes.data.name);
      setStock(stockRes.data.stock);
      setLots(lotRes.data);
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