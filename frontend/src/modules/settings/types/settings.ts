import dayjs from "dayjs"

export type PriceMode = "TAX_INCLUDED" | "TAX_EXCLUDED";

export interface SystemConfig {
  key: string;
  value: string;
}

export const PRICE_MODE_KEY = "priceMode";

export const PRICE_MODE_OPTIONS: { label: string; value: PriceMode }[] = [
  { label: "Precio con impuesto incluido", value: "TAX_INCLUDED" },
  { label: "Precio sin impuesto (se agrega al total)", value: "TAX_EXCLUDED" },
];

export interface LoyaltyConfig {
  earn: {
    enabled: boolean;
    amountPerPoint: number;
  };
  redeem: {
    enabled: boolean;
    pointValue: number;
  };
}

export interface FiscalConfig {
  id: number;
  cai: string;
  establishment: string;
  emissionPoint: string;
  documentType: string;
  rangeStart: string;
  rangeEnd: string;
  expiresAt: string;
  active: boolean;
}

export interface FiscalConfigInput {
  cai: string;
  establishment: string;
  emissionPoint: string;
  documentType: string;
  rangeStart: string;
  rangeEnd: string;
  expiresAt: string;
}

export interface FiscalFormValues extends Omit<FiscalConfigInput, "expiresAt"> {
  expiresAt: dayjs.Dayjs;
}

export interface FiscalConfig {
  id: number;
  userId: number | null;
  cai: string;
  establishment: string;
  emissionPoint: string;
  documentType: string;
  rangeStart: string;
  rangeEnd: string;
  expiresAt: string;
  active: boolean;
  user?: { id: number; username: string; name: string | null } | null;
}

export interface FiscalConfigInput {
  userId?: number;
  cai: string;
  establishment: string;
  emissionPoint: string;
  documentType: string;
  rangeStart: string;
  rangeEnd: string;
  expiresAt: string;
}

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  earn: { enabled: true, amountPerPoint: 1 },
  redeem: { enabled: true, pointValue: 0.01 },
};