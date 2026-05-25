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