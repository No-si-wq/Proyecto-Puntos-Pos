export interface Lot {
  id: number;
  quantity: number;
  cost: number;
  lotNumber?: string;
  expiresAt?: string | null;
  purchase: {
    id: number;
    purchaseNumber: string;
    createdAt: string;
  };
}

export interface InventorySummary {
  id: number;
  sku: string;
  name: string;
  stock: number;
  active: boolean;
}

export interface TransferProductPayload {
  fromProductId: number;
  toProductId: number;
  warehouseId: number;
  quantity: number;       
  factor: number;        
}

export interface TransferPayload {
  productId: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  quantity: number;
}

export interface InventoryRow {
  id: number;
  sku: string;
  name: string;
  stock: number;
  active: boolean;
}

export interface ExpiringRaw {
  productId: number;
  productName: string;
  quantity: number;
  expiresAt: string;
  daysLeft: number;
}

export interface AdjustPayload {
  productId: number;
  physicalQuantity: number;
  note: string;
}

export interface AdjustResult {
  delta: number;
  previousStock: number;
  newStock: number;
  message?: string;
}

export interface TransferReportItem {
  id: number | bigint;
  createdAt: string;
  product: { id: number; name: string; sku: string };
  fromWarehouse: { id: number; name: string };
  toWarehouse: { id: number; name: string } | null;
  quantity: number;
  movementValue: string;
  note: string | null;
}

export interface Filters {
  productId?: number;
  from?: string;
  to?: string;
}

export interface TransferWarehouseItem {
  productId: number;
  quantity: number;
}

export interface TransferWarehousePayload {
  fromWarehouseId: number;
  toWarehouseId: number;
  items: TransferWarehouseItem[];
}