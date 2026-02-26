export interface SaleItemInput {
  productId: number;
  quantity: number;
}

interface BaseSaleInput {
  items: SaleItemInput[];
  pointsUsed?: number;
}

export interface CreateSaleCashInput
  extends BaseSaleInput {
  paymentMethod: "CASH" | "CARD" | "TRANSFER";
  customerId?: number;
  dueDate?: never;
}

export interface CreateSaleCreditInput
  extends BaseSaleInput {
  paymentMethod: "CREDIT";
  customerId: number;
  dueDate?: string;
}

export type CreateSaleInput =
  | CreateSaleCashInput
  | CreateSaleCreditInput;

export enum SaleError {
  EMPTY_SALE = "EMPTY_SALE",
  INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK",
  PRODUCT_NOT_AVAILABLE = "PRODUCT_NOT_AVAILABLE",
  INVALID_TOTAL = "INVALID_TOTAL",
  SALE_NOT_FOUND = "SALE_NOT_FOUND",
}