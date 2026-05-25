import { useEffect, useState } from "react";
import http from "../../core/http/http";

export function useAccountReceivable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load(filters?: any) {
    setLoading(true);
    try {
      const res = await http.get("/account-receivable", {
        params: filters,
      });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function pay(
    id: number,
    amount: number,
    note?: string
  ) {
    await http.post(`/account-receivable/${id}/payments`, {
      amount,
      note,
    });
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return { data, loading, reload: load, pay };
}