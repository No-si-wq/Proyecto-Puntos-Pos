import { useEffect, useState, useCallback } from "react";
import { useRequiredWarehouse } from "./useRequiredWarehouse";
import http from "../../core/http/http";
import type { ProductWithContext } from "../products/product";

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
      const { data } = await http.get<ProductWithContext[]>(
      "/products/by-warehouse"
    );
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