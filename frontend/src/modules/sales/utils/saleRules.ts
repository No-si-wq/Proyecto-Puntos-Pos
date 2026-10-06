import type { DiscountType, PriceMode } from "../types/saleCart.store";

export const MAX_DISCOUNT_PERCENT = 25;

interface LineInput {
  price: number;
  listPrice: number; // precio normal (lista o producto), no el manual
  quantity: number;
  tax: number; // fracción: 0.15
  cost: number;
  discountType: DiscountType;
  discountValue: number;
  priceMode: PriceMode;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function validateSaleLine(l: LineInput): string | null {
  const gross = l.price * l.quantity;

  let discount = 0;
  if (l.discountType === "PERCENTAGE") discount = gross * (l.discountValue / 100);
  if (l.discountType === "FIXED") discount = Math.min(l.discountValue, gross);

  if (gross > 0 && discount > gross * (MAX_DISCOUNT_PERCENT / 100) + 0.005) {
    return `El descuento máximo permitido es ${MAX_DISCOUNT_PERCENT}%`;
  }

  if (l.cost > 0) {
    const toBase = (p: number) =>
      l.priceMode === "TAX_INCLUDED" ? p / (1 + l.tax) : p;

    // El costo incluye impuesto → lo pasamos a base para comparar en la misma unidad
    const costBase = l.cost / (1 + l.tax);

    const base = toBase(gross - discount);
    const unitFloor = Math.min(costBase, toBase(l.listPrice));
    const minLine = round2(unitFloor * l.quantity);

    if (round2(base) < minLine) {
      const minClient =
        l.priceMode === "TAX_INCLUDED" ? minLine * (1 + l.tax) : minLine;
      return `Por debajo del costo o precio de lista. Mínimo permitido en la línea: L ${minClient.toFixed(2)}`;
    }
  }

  return null;
}