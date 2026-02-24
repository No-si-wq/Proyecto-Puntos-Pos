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