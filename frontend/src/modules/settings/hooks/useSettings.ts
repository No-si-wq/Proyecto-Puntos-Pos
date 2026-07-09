import { useCallback, useEffect, useState } from "react";
import http from "../../../core/http/http";
import { PRICE_MODE_KEY, type PriceMode, type LoyaltyConfig, DEFAULT_LOYALTY_CONFIG, type FiscalConfig, type FiscalConfigInput } from "../types/settings";

export function useSettings() {
  const [priceMode, setPriceModeState] = useState<PriceMode>("TAX_INCLUDED");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>(DEFAULT_LOYALTY_CONFIG);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [savingLoyalty, setSavingLoyalty] = useState(false);
  const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig | null>(null);
  const [loadingFiscal, setLoadingFiscal] = useState(false);
  const [savingFiscal, setSavingFiscal] = useState(false);
  const [fiscalConfigs, setFiscalConfigs] = useState<FiscalConfig[]>([]);

  const LOYALTY_CONFIG_KEY = "loyalty_config";

  const load = useCallback(async () => {
    setLoading(true);
    setLoadingLoyalty(true);
    setLoadingFiscal(true);
    try {
      const [priceModeRes, loyaltyRes, fiscalRes, fiscalConfigsRes] = await Promise.allSettled([
        http.get<{ key: string; value: string }>(`/tenants/config/${PRICE_MODE_KEY}`),
        http.get<{ key: string; value: string }>(`/tenants/config/${LOYALTY_CONFIG_KEY}`),
        http.get<FiscalConfig>("/tenants/fiscal-config"),
        http.get<FiscalConfig[]>("/tenants/fiscal-configs"),

      ]);

      if (priceModeRes.status === "fulfilled") {
        setPriceModeState(priceModeRes.value.data.value as PriceMode);
      }

      if (loyaltyRes.status === "fulfilled") {
        try {
          setLoyaltyConfig(JSON.parse(loyaltyRes.value.data.value));
        } catch {
          setLoyaltyConfig(DEFAULT_LOYALTY_CONFIG);
        }
      }

      if (fiscalRes.status === "fulfilled") {
        setFiscalConfig(fiscalRes.value.data);
      }

      if (fiscalConfigsRes.status === "fulfilled") {
        setFiscalConfigs(fiscalConfigsRes.value.data);
      }

    } finally {
      setLoading(false);
      setLoadingLoyalty(false);
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

  async function saveLoyaltyConfig(config: LoyaltyConfig) {
    setSavingLoyalty(true);
    try {
      await http.put(`/tenants/config/${LOYALTY_CONFIG_KEY}`, { value: JSON.stringify(config) });
      setLoyaltyConfig(config);
    } finally {
      setSavingLoyalty(false);
    }
  }

  async function saveFiscalConfig(input: FiscalConfigInput) {
    setSavingFiscal(true);
    try {
      const res = await http.post<FiscalConfig>("/tenants/fiscal-config", input);
      setFiscalConfig(res.data);
    } finally {
      setSavingFiscal(false);
    }
  }

  return { 
    priceMode, 
    loading, 
    saving, 
    savePriceMode, 
    loyaltyConfig, 
    loadingLoyalty, 
    savingLoyalty, 
    saveLoyaltyConfig,
    fiscalConfig,
    fiscalConfigs,
    loadingFiscal,
    savingFiscal,
    saveFiscalConfig
  };
}