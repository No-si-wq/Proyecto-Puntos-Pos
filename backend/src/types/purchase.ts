export interface PurchaseItemInput {
  productId: number;
  quantity: number;
  cost: number;
  expiresAt?: Date | null,
}

export interface CreatePurchaseInput {
  supplierId: number;
  items: PurchaseItemInput[];
}

export enum PurchaseError {
  EMPTY_ITEMS = "EMPTY_ITEMS",
  INVALID_SUPPLIER = "INVALID_SUPPLIER",
  INVALID_ITEM = "INVALID_ITEM",
}