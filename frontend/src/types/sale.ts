import type { BaseItem } from "./base";

export type SalePaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "CREDIT";

export interface SaleItemDTO {
  productId: number;
  quantity: number;
}

export interface CreateSaleDTO {
  customerId?: number;
  pointsUsed?: number;
  items: SaleItemDTO[];
  
  paymentMethod: SalePaymentMethod;
  dueDate?: string;
}

export interface SaleItem extends BaseItem {
  id: number
}

export type SaleStatus = "COMPLETED" | "CANCELLED";

export interface Sale {
  id: number;
  saleNumber: string;
  total: number;
  createdAt: string;
  status: SaleStatus;

  customer?: {
    id: number;
    name: string;
  };

  user: {
    id: number;
    name: string;
  };

  pointsEarned: number;
  pointsUsed: number;

  itemsCount?: number;
}