export type ProductId = number;
export type Quantity = number;
export type ISODateString = string;

export interface InventoryAdjustmentInput {
  productId: ProductId;
  quantity: Quantity;
  note?: string;
}

export interface ExpiringProduct {
  productId: ProductId; 
  productName: string;
  quantity: Quantity;
  expiresAt: ISODateString;
  daysLeft: number;
}

export enum InventoryError {
  INVALID_QUANTITY = "INVALID_QUANTITY",
  INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK",
  INVALID_ITEM = "INVALID_ITEM",
}
