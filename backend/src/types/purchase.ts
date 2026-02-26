export interface PurchaseItemInput {
  productId: number;
  quantity: number;
  cost: number;
  expiresAt?: Date | null,
}

interface BasePurchaseInput {
  supplierId: number;
  items: PurchaseItemInput[];
}

export interface CreatePurchaseCashInput
  extends BasePurchaseInput {
  paymentMethod: "CASH" | "TRANSFER";
  dueDate?: never;
}

export interface CreatePurchaseCreditInput
  extends BasePurchaseInput {
  paymentMethod: "CREDIT";
  dueDate?: string;
}

export type CreatePurchaseInput =
  | CreatePurchaseCashInput
  | CreatePurchaseCreditInput;

export enum PurchaseError {
  EMPTY_ITEMS = "EMPTY_ITEMS",
  INVALID_SUPPLIER = "INVALID_SUPPLIER",
  INVALID_ITEM = "INVALID_ITEM",
}