import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import http from "../../../core/http/http";
import type {
  SalesCommission,
  AssignCommissionDto,
  UpdateCommissionDto,
} from "../types/commission";

const BASE = "/commissions";

export function useCommissions() {
  const [commissions, setCommissions] = useState<SalesCommission[]>([]);
  const [userCommissions, setUserCommissions] = useState<SalesCommission[]>([]);
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

  const fetchByUser = useCallback(async (userId: number) => {
    setLoading(true);
    try {
      const { data } = await http.get<SalesCommission[]>(`${BASE}/user/${userId}`);
      setUserCommissions(data);
      return data;
    } catch {
      message.error("Error al cargar comisiones del usuario");
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

  return { commissions, userCommissions, loading, fetchAll, fetchByUser, assign, update, remove };
}