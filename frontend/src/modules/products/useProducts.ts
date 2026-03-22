import { useEffect, useState, useCallback } from "react";
import { message } from "antd";
import http from "../../core/http/http";
import type { Product, CreateProductDTO, UpdateProductDTO, ApiProduct } from "./product";
import type { ProductPrice } from "../priceLists/pricelist";
import type { Filters } from "../inventory/types/inventory";
import { mapProduct } from "./product";

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

export function useProductPrices(productId: number, enabled: boolean) {
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!productId || !enabled) return;
    setLoading(true);
    try {
      const { data } = await http.get<ProductPrice[]>(`/products/${productId}/prices`);
      setPrices(Array.isArray(data) ? data : []);
    } catch {
      message.error("Error al cargar precios del producto");
    } finally {
      setLoading(false);
    }
  }, [productId, enabled]);

  useEffect(() => {
    if (enabled) load();
    else setPrices([]);
  }, [enabled, load]);

  const upsertPrice = async (dto: { priceListId: number; price: number }) => {
    try {
      const { data } = await http.put<ProductPrice>(`/products/${productId}/prices`, dto);
      setPrices((prev) => {
        const exists = prev.some((p) => p.priceListId === dto.priceListId);
        return exists
          ? prev.map((p) => (p.priceListId === dto.priceListId ? data : p))
          : [...prev, data];
      });
      message.success("Precio actualizado");
    } catch {
      message.error("Error al actualizar precio");
      throw new Error();
    }
  };

  const removePrice = async (priceListId: number) => {
    try {
      await http.delete(`/products/${productId}/prices/${priceListId}`);
      setPrices((prev) => prev.filter((p) => p.priceListId !== priceListId));
      message.success("Precio eliminado");
    } catch {
      message.error("Error al eliminar precio");
    }
  };

  return { prices, loading, upsertPrice, removePrice };
}