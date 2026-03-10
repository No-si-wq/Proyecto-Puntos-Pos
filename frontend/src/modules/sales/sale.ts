import type { BaseItem } from "../../core/types/base";

export type SalePaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "CREDIT";

export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED";

export interface SaleItemDTO {
  productId: number;
  quantity: number;
  discountType?: DiscountType;
  discountValue?: number;
}

export interface SaleItems {
  product: {
    id: number;
    name: string;
  };
  price: number;
  lineSubtotal: number;
  quantity: number;
  discountAmount: number;
  discountType?: DiscountType;
  discountValue?: number;
  commissionPercent?: number;
  commissionAmount?: number;
}

export interface CreateSaleDTO {
  customerId?: number;
  pointsUsed?: number;
  priceListId?: number;
  items: SaleItemDTO[];
  paymentMethod: SalePaymentMethod;
  dueDate?: string;
}

export interface SaleItem extends BaseItem {
  id: number;
}

export type SaleStatus = "COMPLETED" | "CANCELLED";

export interface Sale {
  id: number;
  saleNumber: string;
  total: number;
  subtotal: number;
  discount: number;
  grossSubtotal?: number;
  totalCommission?: number;
  createdAt: string;
  status: SaleStatus;
  paymentMethod: SalePaymentMethod;
  priceListId?: number | null;

  customer?: {
    id: number;
    name: string;
  };

  user: {
    id: number;
    name: string;
  };

  priceList?: {
    id: number;
    name: string;
  };

  pointsEarned: number;
  pointsUsed: number;

  itemsCount?: number;
  items: SaleItems[];
}