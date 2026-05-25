export interface PurchaseLotsParams {
  product?: string;
  days?: number;
  expired?: boolean;
}

export interface PurchaseLotReportItem {
  id: number;
  quantity: number;
  cost: number;
  lotNumber: string;
  expiresAt?: string | null;
  product: { id: number; name: string; sku: string };
  purchase: {
    id: number;
    purchaseNumber: string;
    createdAt: string;
    supplier: { id: number; name: string };
  };
}

export type KardexRow = {
  id: string;
  createdAt: string;
  type: "IN" | "OUT";
  quantity: number;
  movementValue: string;   
  balance_qty: string;     
  balance_value: string;   
  referenceType?: string;
  referenceId?: number;
  note?: string;
};

export type KardexTableRow = KardexRow & {
  isInitial?: boolean;
};

export interface ProfitDetail {
  saleNumber: string;
  date: string;
  total: number;
  cogs: number;
  profit: number;
  margin: number;
  customer: string;
  seller: string;
}

export interface ProfitSummary {
  seller: string;
  totalSales: number;
  totalCogs: number;
  totalProfit: number;
  margin: number;
}

export interface SoldProductRow {
  productId: number;
  sku: string;
  name: string;
  category: string;
  cost: number;
  quantitySold: number;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  margin: number;
  price: number;
} 

export interface ProductOutputRow {
  productId:     number;
  sku:           string;
  name:          string;
  category:      string;
  totalQuantity: number;
  totalValue:    number;
  movementCount: number;
}