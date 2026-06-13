export type SalePaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "CREDIT";

export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED";
export type PriceMode = "TAX_INCLUDED" | "TAX_EXCLUDED";

export interface SaleItemDTO {
  productId: number;
  quantity: number;
  discountType?: DiscountType;
  discountValue?: number;
  unitPrice?: number;
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
  returnedQuantity?: number;
  refundedAmount?: number;
  observations?: string | null;
}

export interface SalePaymentInput {
  method: SalePaymentMethod;
  amount: number;
  reference?: string;
}

export interface SalePayment {
  id: number;
  method: SalePaymentMethod;
  amount: number;
  reference?: string | null;
}

export interface CreateSaleDTO {
  customerId?: number;
  pointsUsed?: number;
  sellerId?: number;
  priceListId?: number;
  items: SaleItemDTO[];
  payments: SalePaymentInput[];
  dueDate?: string;
  priceMode: PriceMode;
  amountPaid?: number;
  observations?: string | null;
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
  payments?: SalePayment[];
  paymentMethod: SalePaymentMethod;
  priceListId?: number | null;
  amountPaid?: number | null;
  changeAmount?: number | null;
  totalRefunded?: number;
  observations?: string | null;

  customer?: {
    id: number;
    name: string;
    dni: string;
    direction: string;
    phone: string;
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

// Agregar a los tipos existentes

export interface ReturnItemInput {
  saleItemId: number;
  quantity: number;
}

export interface ReturnSaleDTO {
  items: ReturnItemInput[];
  reason?: string;
}

export interface SaleReturnItem {
  id: number;
  saleItemId: number;
  quantity: number;
  refundAmount: number;
}

export interface SaleReturn {
  id: number;
  saleId: number;
  reason?: string;
  createdAt: string;
  items: SaleReturnItem[];
}