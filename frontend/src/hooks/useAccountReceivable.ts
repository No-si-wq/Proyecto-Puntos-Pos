import { useEffect, useState } from "react";
import {
  getReceivables,
  registerReceivablePayment,
} from "../api/accountReceivable.api";

export function useAccountReceivable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load(filters?: any) {
    setLoading(true);
    try {
      const res = await getReceivables(filters);
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
    await registerReceivablePayment(id, {
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