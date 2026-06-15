export interface SalePaymentInput {
  method: "CASH" | "CARD" | "TRANSFER" | "CREDIT";
  amount: number;
  reference?: string;
}

export interface SaleItemInput {
  productId: number;
  quantity: number;
  priceListId?: number;
  discountType?: "NONE" | "PERCENTAGE" | "FIXED"
  discountValue?: number
  observations?: string | null;
  unitPrice?: number;
}

interface BaseSaleInput {
  items: SaleItemInput[];
  pointsUsed?: number;
  sellerId?: number;
  observations?: string | null;
  priceMode?: "TAX_INCLUDED" | "TAX_EXCLUDED";
  payments: SalePaymentInput[];
}

export interface CreateSaleCashInput
  extends BaseSaleInput {
  customerId?: number;
  dueDate?: never;
}

export interface CreateSaleCreditInput
  extends BaseSaleInput {
  customerId: number;
  dueDate?: string;
}

export type CreateSaleInput =
  | CreateSaleCashInput
  | CreateSaleCreditInput;

export interface ReturnItemInput {
  saleItemId: number;
  quantity: number;
}

export interface ReturnSaleInput {
  items: ReturnItemInput[];
  reason?: string;
}

export enum SaleError {
  EMPTY_SALE = "EMPTY_SALE",
  INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK",
  PRODUCT_NOT_AVAILABLE = "PRODUCT_NOT_AVAILABLE",
  INVALID_TOTAL = "INVALID_TOTAL",
  SALE_NOT_FOUND = "SALE_NOT_FOUND",
  INVALID_PRICE_LIST = "INVALID_PRICE_LIST",
  SALE_ALREADY_CANCELLED = "SALE_ALREADY_CANCELLED",
  SALE_HAS_PAYMENTS = "SALE_HAS_PAYMENTS",
  RETURN_QUANTITY_EXCEEDS = "La cantidad a devolver supera la vendida",
  RETURN_ITEM_NOT_FOUND   = "Ítem de venta no encontrado",
  SALE_CANCELLED          = "No se puede devolver una venta cancelada",
  CREDIT_LIMIT_EXCEEDED = "CREDIT_LIMIT_EXCEEDED",
  FISCAL_CONFIG_EXPIRED = "El CAI fiscal ha vencido. Renueva la autorización en el SAR.",
  FISCAL_RANGE_EXCEEDED = "El correlativo ha superado el rango autorizado por el SAR. Solicita un nuevo CAI.",
}