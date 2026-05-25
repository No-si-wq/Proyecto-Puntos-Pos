import { useState, useEffect, useCallback } from 'react';
import http from '../../../core/http/http';
import type { Remission, CreateRemissionPayload } from '../types/remission';

export function useRemissions() {
  const [remissions, setRemissions] = useState<Remission[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (warehouseId?: number) => {
    setLoading(true);
    try {
      const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
      const { data } = await http.get<Remission[]>(`/remissions${params}`);
      setRemissions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create(payload: CreateRemissionPayload): Promise<Remission> {
    const { data } = await http.post<Remission>('/remissions', payload);
    await load();
    return data;
  }

  async function cancel(id: number) {
    await http.patch(`/remissions/${id}/cancel`);
    await load();
  }

  async function deliver(id: number) {
    await http.patch(`/remissions/${id}/deliver`);
    await load();
  }

  return { remissions, loading, reload: load, create, cancel, deliver };
}

export function useRemissionDetail(id: number) {
  const [remission, setRemission] = useState<Remission | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await http.get<Remission>(`/remissions/${id}`);
      setRemission(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { remission, loading };
}