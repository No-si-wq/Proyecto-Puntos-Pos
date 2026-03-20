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
  id: number;
  product: {
    id: number;
    sku: string;
    name: string;
  };
  price: number;
  tax: number;
  total: number;
  taxAmount: number;
  lineSubtotal: number;
  lineTotal: number;
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
  sellerId?: number;
  priceListId?: number;
  items: SaleItemDTO[];
  paymentMethod: SalePaymentMethod;
  dueDate?: string;
}

export type SaleStatus = "COMPLETED" | "CANCELLED";

export interface Sale {
  id: number;
  saleNumber: string;
  total: number;
  subtotal: number;
  discount: number;
  taxTotal: number;
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

  seller: {
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