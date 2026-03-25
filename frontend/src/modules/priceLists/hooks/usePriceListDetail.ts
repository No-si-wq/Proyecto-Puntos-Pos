import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import http from "../../../core/http/http";
import type { PriceListDetail, UpsertProductPriceDto } from "../types/pricelist";

const BASE = "/priceLists";

export function usePriceListDetail(id: number | null) {
  const [detail, setDetail] = useState<PriceListDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await http.get<PriceListDetail>(`${BASE}/${id}`);
      setDetail(data);
    } catch {
      message.error("Error al cargar detalle de lista de precios");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const upsertPrice = async (dto: UpsertProductPriceDto) => {
    if (!id) return;
    try {
      const { data } = await http.put(`${BASE}/${id}/products`, dto);
      setDetail((prev) => {
        if (!prev) return prev;
        const exists = prev.prices.some((p) => p.productId === dto.productId);
        const prices = exists
          ? prev.prices.map((p) => (p.productId === dto.productId ? data : p))
          : [...prev.prices, data];
        return { ...prev, prices };
      });
      message.success("Precio actualizado");
      await fetchDetail();
    } catch {
      message.error("Error al actualizar precio");
    }
  };

  const removePrice = async (productId: number) => {
    if (!productId) return;
    try {
      await http.delete(`${BASE}/${id}/products/${productId}`);
      setDetail((prev) =>
        prev ? { ...prev, prices: prev.prices.filter((p) => p.productId !== productId) } : prev
      );
      message.success("Precio eliminado");
      await fetchDetail();
    } catch {
      message.error("Error al eliminar precio");
    }
  };

  return { detail, loading, fetchDetail, upsertPrice, removePrice };
}