export type AlertPriority =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type AlertType =
  | "EXPIRING"
  | "LOW_STOCK";

export interface BaseAlert {
  id: string | number;
  type: AlertType;
  priority: AlertPriority;
  createdAt?: string;
}

export interface ExpiringAlert extends BaseAlert {
  type: "EXPIRING";
  productId: number;
  productName: string;
  quantity: number;
  expiresAt: string;
  daysLeft: number;
}

export interface LowStockAlert extends BaseAlert {
  type: "LOW_STOCK";
  productId: number;
  productName: string;
  stock: number;
}