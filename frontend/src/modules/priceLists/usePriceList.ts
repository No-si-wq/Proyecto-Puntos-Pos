import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import http from "../../core/http/http";
import type {
  PriceList,
  PriceListDetail,
  CreatePriceListDto,
  UpdatePriceListDto,
  UpsertProductPriceDto,
} from "./pricelist";

const BASE = "/priceLists";

export function usePriceLists() {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<PriceList[]>(BASE);
      setPriceLists(Array.isArray(data) ? data : []);
    } catch {
      message.error("Error al cargar listas de precios");
      setPriceLists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (dto: CreatePriceListDto) => {
    try {
      const { data } = await http.post<PriceList>(BASE, dto);
      setPriceLists((prev) => [...prev, { ...data, _count: { prices: 0 } }]);
      message.success("Lista de precios creada");
      return data;
    } catch {
      message.error("Error al crear lista de precios");
      throw new Error();
    }
  };

  const update = async (id: number, dto: UpdatePriceListDto) => {
    try {
      const { data } = await http.put<PriceList>(`${BASE}/${id}`, dto);
      setPriceLists((prev) => prev.map((pl) => (pl.id === id ? { ...pl, ...data } : pl)));
      message.success("Lista de precios actualizada");
      return data;
    } catch {
      message.error("Error al actualizar lista de precios");
      throw new Error();
    }
  };

  const remove = async (id: number, active: boolean) => {
    try {
      await http.patch(`${BASE}/${id}/activate`, { active });
      setPriceLists((prev) => prev.filter((pl) => pl.id !== id));
      message.success("Lista de precios eliminada");
    } catch {
      message.error("No se puede eliminar: tiene productos asignados");
    }
  };

  return { priceLists, loading, fetchAll, create, update, remove };
}

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
    } catch {
      message.error("Error al eliminar precio");
    }
  };

  return { detail, loading, fetchDetail, upsertPrice, removePrice };
}
