import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import http from "../../../core/http/http";
import type { ProductPrice } from "../../priceLists/types/pricelist";

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