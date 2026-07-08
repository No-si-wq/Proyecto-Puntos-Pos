import { useEffect, useState, useCallback } from "react";
import http from "../../../core/http/http";
import type { Product, CreateProductDTO, UpdateProductDTO, ApiProduct, productSearch } from "../types/product";
import { mapProduct } from "../types/product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<productSearch>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<ApiProduct[]>("/products", {
        params: { 
          search: filters.search,
          onlyInactive: filters.onlyInactive ? "true" : undefined,
        },
      });
      setProducts(data.map(mapProduct));
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.onlyInactive]);

  useEffect(() => { load(); }, [load]);

  const create = async (payload: CreateProductDTO | FormData) => {
    const isFormData = payload instanceof FormData;
    await http.post(`/products`, payload, isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);
    await load();
  };
  const update = async (id: number, p: UpdateProductDTO | FormData) => {
    const isFormData = p instanceof FormData;
    await http.put(`/products/${id}`, p, isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);
    await load();
  };
  const toggleActive = async (id: number, active: boolean) => { 
    await http.patch(`/products/${id}/activate`, { active }); await load(); 
  };
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
