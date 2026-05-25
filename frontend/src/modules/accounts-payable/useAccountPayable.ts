import { useEffect, useState } from "react";
import http from "../../core/http/http";

export function useAccountPayable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load(filters?: any) {
    setLoading(true);
    try {
      const res = await http.get("/account-payable", {
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
    await http.post(`/account-payable/${id}/payments`, {
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