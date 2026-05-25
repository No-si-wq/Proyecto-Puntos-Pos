import { useCallback, useEffect, useState } from "react";
import http from "../../../core/http/http";
import { PRICE_MODE_KEY, type PriceMode } from "../types/settings";

export function useSettings() {
  const [priceMode, setPriceModeState] = useState<PriceMode>("TAX_INCLUDED");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<{ key: string; value: string }>(
        `/tenants/config/${PRICE_MODE_KEY}`
      );
      setPriceModeState(data.value as PriceMode);
    } catch {
      // Si no existe aún, queda el default TAX_INCLUDED
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function savePriceMode(value: PriceMode) {
    setSaving(true);
    try {
      await http.put(`/tenants/config/${PRICE_MODE_KEY}`, { value });
      setPriceModeState(value);
    } finally {
      setSaving(false);
    }
  }

  return { priceMode, loading, saving, savePriceMode };
}