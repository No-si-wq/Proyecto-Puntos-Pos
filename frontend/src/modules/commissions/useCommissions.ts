import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import http from "../../core/http/http";
import type {
  CommissionLevel,
  SalesCommission,
  CreateCommissionLevelDto,
  UpdateCommissionLevelDto,
  AssignCommissionDto,
  UpdateCommissionDto,
} from "./commission";

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
    } catch {
      message.error("No se puede eliminar: tiene usuarios asignados");
    }
  };

  return { levels, loading, fetchAll, create, update, remove };
}

export function useCommissions() {
  const [commissions, setCommissions] = useState<SalesCommission[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<SalesCommission[]>(BASE);
      setCommissions(data);
    } catch {
      message.error("Error al cargar comisiones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const assign = async (dto: AssignCommissionDto) => {
    try {
      const { data } = await http.post<SalesCommission>(BASE, dto);
      setCommissions((prev) => {
        const exists = prev.find(
          (c) => c.userId === dto.userId && c.levelId === dto.levelId
        );
        return exists
          ? prev.map((c) =>
              c.userId === dto.userId && c.levelId === dto.levelId ? data : c
            )
          : [...prev, data];
      });
      message.success("Comisión asignada");
      await fetchAll();
      return data;
    } catch {
      message.error("Error al asignar comisión");
      throw new Error();
    }
  };

  const update = async (id: number, dto: UpdateCommissionDto) => {
    try {
      const { data } = await http.put<SalesCommission>(`${BASE}/${id}`, dto);
      setCommissions((prev) => prev.map((c) => (c.id === id ? data : c)));
      message.success("Comisión actualizada");
      await fetchAll();
      return data;
    } catch {
      message.error("Error al actualizar comisión");
      throw new Error();
    }
  };

  const remove = async (id: number, active: boolean) => {
    try {
      await http.patch(`${BASE}/${id}/activate`, {active});
      setCommissions((prev) => prev.filter((c) => c.id !== id));
      message.success("Comisión eliminada");
      await fetchAll();
    } catch {
      message.error("Error al eliminar comisión");
    }
  };

  return { commissions, loading, fetchAll, assign, update, remove };
}