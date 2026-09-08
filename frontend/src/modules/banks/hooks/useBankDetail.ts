import { useEffect, useState } from "react";
import http from "../../../core/http/http";
import type { Bank, BankTransaction, BankMovementInput } from "../types/bank";

export function useBankDetail(bankId?: number) {
  const [bank, setBank] = useState<Bank | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<any>({});

  async function loadBank() {
    if (!bankId) return;
    const res = await http.get(`/banks/${bankId}`);
    setBank(res.data);
  }

  async function loadTransactions(filters?: any) {
    if (!bankId) return;
    setLoading(true);
    setCurrentFilters(filters ?? {});
    try {
      const res = await http.get("/banks/transactions", {
        params: { bankId, ...filters },
      });
      setTransactions(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function registerMovement(data: BankMovementInput) {
    if (!bankId) return;
    await http.post(`/banks/${bankId}/movements`, data);
    await Promise.all([loadBank(), loadTransactions(currentFilters)]);
  }

  async function reconcile(transactionIds: number[]) {
    await http.post("/banks/transactions/reconcile", { transactionIds });
    await loadTransactions(currentFilters);
  }

  useEffect(() => {
    loadBank();
    loadTransactions();
  }, [bankId]);

  return {
    bank,
    transactions,
    loading,
    reload: loadTransactions,
    registerMovement,
    reconcile,
  };
}