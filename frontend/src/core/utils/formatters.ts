export type SalePaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "CREDIT";

export function formatCurrency(
  value: number,
  currency = "HNL"
): string {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(
  value: number,
  minimumFractionDigits = 2
): string {
  return new Intl.NumberFormat("es-HN", {
    style: "percent",
    minimumFractionDigits,
  }).format(value / 100);
}

export function formatDate(
  value: string | Date,
  withTime = true
): string {
  const date = new Date(value);

  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime && {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
}

const PAYMENT_METHOD_LABELS: Record<SalePaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  CREDIT: "Crédito",
};

export function paymentMethodLabel(method: SalePaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}