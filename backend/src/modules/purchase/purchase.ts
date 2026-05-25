export interface PurchaseItemInput {
  productId: number;
  quantity: number;
  cost: number;
  unit: string;
  lotNumber: string;
  expiresAt?: Date | null,
}

interface BasePurchaseInput {
  supplierId: number;
  purchaseNumber: string;
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
  PURCHASE_NOT_FOUND = "PURCHASE_NOT_FOUND",
  PURCHASE_ALREADY_CANCELLED = "PURCHASE_ALREADY_CANCELLED",
  PURCHASE_HAS_PAYMENTS = "PURCHASE_HAS_PAYMENTS",
  PURCHASE_HAS_LINKED_SALES = ".PURCHASE_HAS_LINKED_SALES",
}