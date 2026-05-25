export type PurchasePaymentMethod =
  | "CASH"
  | "TRANSFER"
  | "CREDIT";

export interface PurchaseItemCreateDTO {
  productId: number;
  quantity: number;
  cost: number;
  lotNumber?: string | null;
  expiresAt?: string | null;
}

export interface PurchaseItems {
  id: number;
  quantity: number;
  cost: number;
  lotNumber?: string;
  product: {
    id: number;
    name: string;
  };
}

export interface CreatePurchaseDTO {
  supplierId: number;
  items: PurchaseItemCreateDTO[];
  paymentMethod: PurchasePaymentMethod;
  purchaseNumber: string;
  dueDate?: string;
}

export type PurchaseStatus = "ACTIVE" | "CANCELLED";

export interface Purchase {
  id: number;
  total: number;
  createdAt: string;
  status: PurchaseStatus;
  purchaseNumber: string;

  supplier: {
    id: number;
    name: string;
  };

  user: {
    id: number;
    name: string;
  };

  items: PurchaseItems[];
  itemsCount?: number;
}
