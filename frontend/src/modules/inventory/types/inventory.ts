export interface InventoryRow {
  id: number;
  sku: string;
  name: string;
  stock: number;
  active: boolean;
}

export interface InventorySummary {
  id: number;
  sku: string;
  name: string;
  stock: number;
  active: boolean;
}

export interface Filters {
  search?: string;
}

export interface Lot {
  id: number;
  quantity: number;
  cost: number;
  expiresAt?: string | null;
  purchase: {
    id: number;
    createdAt: string;
  };
}

export interface ExpiringRaw {
  productId: number;
  productName: string;
  quantity: number;
  expiresAt: string;
  daysLeft: number;
}