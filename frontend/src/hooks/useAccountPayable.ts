import { useEffect, useState } from "react";
import {
  getPayables,
  registerPayablePayment,
} from "../api/accountPayable.api";

export function useAccountPayable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load(filters?: any) {
    setLoading(true);
    try {
      const res = await getPayables(filters);
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
    await registerPayablePayment(id, {
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