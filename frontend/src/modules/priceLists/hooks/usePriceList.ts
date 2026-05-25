import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import http from "../../../core/http/http";
import type {
  PriceList,
  CreatePriceListDto,
  UpdatePriceListDto,
} from "../types/pricelist";

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