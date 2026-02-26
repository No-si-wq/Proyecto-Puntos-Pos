import type { BaseItem } from "./base";

export type PurchasePaymentMethod =
  | "CASH"
  | "TRANSFER"
  | "CREDIT";

export interface PurchaseItemCreateDTO {
  productId: number;
  quantity: number;
  cost: number;
  expiresAt?: string | null;
}

export interface CreatePurchaseDTO {
  supplierId: number;
  items: PurchaseItemCreateDTO[];
  paymentMethod: PurchasePaymentMethod;
  dueDate?: string;
}

export interface PurchaseItem extends BaseItem {
  id: number;
  expiresAt?: string | null;
}

export interface Purchase {
  id: number;
  total: number;
  createdAt: string;

  supplier: {
    id: number;
    name: string;
  };

  user: {
    id: number;
    name: string;
  };

  itemsCount?: number;
}
