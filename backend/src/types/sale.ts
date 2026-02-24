export interface SaleItemInput {
  productId: number;
  quantity: number;
}

export interface CreateSaleInput {
  customerId?: number;
  items: SaleItemInput[];
  pointsUsed?: number;
}

export enum SaleError {
  EMPTY_SALE = "EMPTY_SALE",
  INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK",
  PRODUCT_NOT_AVAILABLE = "PRODUCT_NOT_AVAILABLE",
  INVALID_TOTAL = "INVALID_TOTAL",
  SALE_NOT_FOUND = "SALE_NOT_FOUND",
}