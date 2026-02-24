import { useEffect, useState, useCallback } from "react";
import { useRequiredWarehouse } from "./useRequiredWarehouse";
import { getProductsByWarehouse } from "../api/product.api";
import type { ProductWithContext } from "../types/product";

export function useWarehouseProducts() {
  const warehouseId = useRequiredWarehouse();

  const [products, setProducts] = useState<ProductWithContext[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!warehouseId) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const data = await getProductsByWarehouse();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { products, reload: load, loading };
}