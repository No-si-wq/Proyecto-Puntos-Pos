import { useEffect, useState, useCallback } from "react";
import http from "../../../core/http/http";
import type { Product, CreateProductDTO, UpdateProductDTO, ApiProduct } from "../types/product";
import type { Filters } from "../../inventory/types/inventory";
import { mapProduct } from "../types/product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<Product[]>("/products", {
        params: {search: filters.search}
      });
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, [filters.search]);

  useEffect(() => { load(); }, [load]);

  const create       = async (payload: CreateProductDTO)          => { await http.post(`/products`, payload);                  await load(); };
  const update       = async (id: number, p: UpdateProductDTO)    => { await http.put(`/products/${id}`, p);                   await load(); };
  const toggleActive = async (id: number, active: boolean)        => { await http.patch(`/products/${id}/activate`, { active }); await load(); };
  const importExcel  = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    await http.post("/products/import", form, { headers: { "Content-Type": "multipart/form-data" } });
    await load();
  };

  const findByBarcode = async (code: string): Promise<Product | null> => {
    const { data } = await http.get<ApiProduct>(`/products/by-barcode/${code}`);
    return mapProduct(data);
  };

  const reorderPoints = async (productId: number, reorderPoint: number) => {
    await http.patch(`/products/${productId}/point`, { reorderPoint })
    await load();
  }

  return { products, loading, filters, setFilters, reload: load, create, update, toggleActive, importExcel, findByBarcode, reorderPoints };
}