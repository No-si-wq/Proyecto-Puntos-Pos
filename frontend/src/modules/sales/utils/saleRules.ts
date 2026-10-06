import type { DiscountType, PriceMode } from "../types/saleCart.store";

export const MAX_DISCOUNT_PERCENT = 25;

interface LineInput {
  price: number;
  quantity: number;
  tax: number; // fracción: 0.15
  cost: number;
  discountType: DiscountType;
  discountValue: number;
  priceMode: PriceMode;
}

export function validateSaleLine(l: LineInput): string | null {
  const gross = l.price * l.quantity;

  let discount = 0;
  if (l.discountType === "PERCENTAGE") discount = gross * (l.discountValue / 100);
  if (l.discountType === "FIXED") discount = Math.min(l.discountValue, gross);

  if (gross > 0 && discount > gross * (MAX_DISCOUNT_PERCENT / 100) + 0.005) {
    return `El descuento máximo permitido es ${MAX_DISCOUNT_PERCENT}%`;
  }

  // Si no hay costo cargado, no se valida aquí (el backend sigue validando)
  if (l.cost > 0) {
    const afterDiscount = gross - discount;
    const base =
      l.priceMode === "TAX_INCLUDED" ? afterDiscount / (1 + l.tax) : afterDiscount;

    if (Math.round(base * 100) / 100 < l.cost * l.quantity) {
      return "No se puede vender por debajo del costo";
    }
  }

  return null;
}