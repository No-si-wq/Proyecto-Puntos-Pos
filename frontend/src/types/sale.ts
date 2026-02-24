import type { BaseItem } from "./base";

export interface SaleItemDTO {
  productId: number;
  quantity: number;
}

export interface CreateSaleDTO {
  customerId?: number;
  pointsUsed?: number;
  items: SaleItemDTO[];
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