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

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  earn: { enabled: true, amountPerPoint: 1 },
  redeem: { enabled: true, pointValue: 0.01 },
};