import { useEffect, useState } from "react";
import http from "../../core/http/http";

export function useAccountReceivable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<any>({});

  async function load(filters?: any) {
    setLoading(true);
    setCurrentFilters(filters ?? {});
    try {
      const res = await http.get("/account-receivable", {
        params: filters,
      });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function getById(id: number) {
    const res = await http.get(`/account-receivable/${id}`);
    return res.data;
  }

  async function pay(
    id: number,
    amount: number,
    note?: string,
    bankId?: number
  ) {
    const res = await http.post(`/account-receivable/${id}/payments`, {
      amount,
      note,
      bankId,
    });
    await load(currentFilters);
    return res.data; // <-- agregado
  }

  useEffect(() => {
    load();
  }, []);

  return { data, loading, reload: load, pay, getById };
}