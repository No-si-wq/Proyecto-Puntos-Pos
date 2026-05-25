import { useEffect, useState, useCallback } from "react";
import { useRequiredWarehouse } from "./useRequiredWarehouse";
import http from "../../../core/http/http";
import type { ApiProduct, ProductWithContext } from "../../products/types/product";
import { mapProduct } from "../../products/types/product";

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
      const { data } = await http.get<ApiProduct[]>(
      "/products/by-warehouse"
    );
      setProducts(data.map((product) => mapProduct(product) as ProductWithContext));
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { products, reload: load, loading };
}
