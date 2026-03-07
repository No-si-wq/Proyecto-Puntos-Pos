export interface DashboardMetrics {
  salesToday: number;
  purchasesToday: number;
  incomeToday: number;
  expenseToday: number;
  balanceToday: number;
}

export interface LowStockItem {
  productId: number;
  product: {
    id: number;
    name: string;
    sku: string;
  };
  stock: number;
}

export interface ExpiringItem {
  id: number;
  product: {
    id: number;
    name: string;
  };
  quantity: number;
  expiresAt: string;
}

export interface TopProduct {
  productId: number;
  product: {
    id: number;
    name: string;
  }; 
  _sum: {
    quantity: number | null;
  };
}

export interface DashboardData {
  metrics: DashboardMetrics;
  lowStock: LowStockItem[];
  expiring: ExpiringItem[];
  topProducts: TopProduct[];
}

export interface AdminDashboardData {
  financial: {
    revenue: number;
    expenses: number;
    totalCogs: number;
    grossProfit: number;
    net: number;
    margin: number;
  };
  salesByWarehouse: {
    warehouseId: number;
    warehouseName: string;
    totalSales: number;
    totalCogs: number;
    totalProfit: number;
    count: number;
  }[];
  inventoryValue: number;
  topProducts: {
    productId: number;
    name: string;
    totalSold: number;
  }[];
  metrics: {
    averageTicket: number;
    inventoryTurnover: number,
  };
}