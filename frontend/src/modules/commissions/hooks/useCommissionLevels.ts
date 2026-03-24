import { useState, useCallback, useEffect } from "react";
import { message } from "antd";
import http from "../../../core/http/http";
import type { 
  CommissionLevel,
  CreateCommissionLevelDto,
  UpdateCommissionLevelDto,
} from "../types/commission";


const BASE = "/commissions";

export function useCommissionLevels() {
  const [levels, setLevels] = useState<CommissionLevel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<CommissionLevel[]>(`${BASE}/levels`);
      setLevels(data);
    } catch {
      message.error("Error al cargar niveles de comisión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (dto: CreateCommissionLevelDto) => {
    try {
      const { data } = await http.post<CommissionLevel>(`${BASE}/levels`, dto);
      setLevels((prev) => [...prev, { ...data, _count: { commissions: 0 } }]);
      message.success("Nivel de comisión creado");
      await fetchAll();
      return data;
    } catch {
      message.error("Error al crear nivel de comisión");
      throw new Error();
    }
  };

  const update = async (id: number, dto: UpdateCommissionLevelDto) => {
    try {
      const { data } = await http.put<CommissionLevel>(`${BASE}/levels/${id}`, dto);
      setLevels((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
      message.success("Nivel actualizado");
      await fetchAll();
      return data;
    } catch {
      message.error("Error al actualizar nivel");
      throw new Error();
    }
  };

  const remove = async (id: number) => {
    try {
      await http.delete(`${BASE}/levels/${id}`);
      setLevels((prev) => prev.filter((l) => l.id !== id));
      message.success("Nivel eliminado");
      await fetchAll();
    } catch {
      message.error("No se puede eliminar: tiene usuarios asignados");
    }
  };

  return { levels, loading, fetchAll, create, update, remove };
}