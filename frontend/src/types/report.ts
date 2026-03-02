export interface PurchaseLotsParams {
  product?: string;
  days?: number;
  expired?: boolean;
}

export interface PurchaseLotReportItem {
  id: number;
  quantity: number;
  cost: number;
  expiresAt?: string | null;
  product: { id: number; name: string; sku: string };
  purchase: {
    id: number;
    createdAt: string;
    supplier: { id: number; name: string };
  };
}

export interface KardexRow {
  date: string;
  type: "IN" | "OUT";
  reference: string;
  quantity: number;
  unit_cost: number;
  movement_value: number;
  balance_qty: number;
  balance_value: number;
}

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
  totalSales: number;
  totalCogs: number;
  totalProfit: number;
  margin: number;
}