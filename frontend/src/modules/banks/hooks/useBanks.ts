import { useEffect, useState } from "react";
import http from "../../../core/http/http";
import type {
  Bank,
  CreateBankInput,
  UpdateBankInput,
  BankTransferInput,
} from "../types/bank";

export function useBanks() {
  const [data, setData] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);

  async function load(filters?: { active?: boolean }) {
    setLoading(true);
    try {
      const res = await http.get("/banks", { params: filters });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function create(values: CreateBankInput) {
    await http.post("/banks", values);
    await load();
  }

  async function update(id: number, values: UpdateBankInput) {
    await http.patch(`/banks/${id}`, values);
    await load();
  }

  async function toggleActive(id: number, active: boolean) {
    await http.patch(`/banks/${id}/toggle`, { active });
    await load();
  }

  async function transfer(values: BankTransferInput) {
    await http.post("/banks/transfer", values);
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return { data, loading, reload: load, create, update, toggleActive, transfer };
}