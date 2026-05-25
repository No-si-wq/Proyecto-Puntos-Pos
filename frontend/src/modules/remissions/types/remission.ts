export type RemissionStatus = 'PENDING' | 'DELIVERED' | 'CANCELLED';

export interface RemissionItem {
  id: number;
  productId: number;
  quantity: number;
  note?: string;
  product: { id: number; name: string; sku: string };
}

export interface Remission {
  id: number;
  remissionNumber: string;
  status: RemissionStatus;
  warehouseId: number;
  customerName?: string;
  note?: string;
  createdAt: string;
  warehouse: { id: number; name: string };
  user: { id: number; name: string; username: string };
  items: RemissionItem[];
  _count?: { items: number };
}

export interface CreateRemissionPayload {
  warehouseId: number;
  customerName?: string;
  note?: string;
  items: { productId: number; quantity: number; note?: string }[];
}