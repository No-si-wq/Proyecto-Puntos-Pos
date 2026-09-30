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

export interface GeneralInventoryRow {
  productId:    number;
  sku:          string;
  name:         string;
  category:     string;
  stock:        number;
  cost:         number;
  totalValue:   number;
  reorderPoint: number;
  belowReorder: boolean;
}

export interface CustomerStatementSummaryRow {
  customerId: number;
  name: string;
  dni: string | null;
  phone: string | null;
  creditLimit: number | null;
  openInvoices: number;
  totalCredit: number;
  totalPaid: number;
  balance: number;
  overdueBalance: number;
}

export interface CustomerStatementInvoiceRow {
  id: number;
  saleNumber: string;
  saleDate: string;
  dueDate: string | null;
  total: number;
  paidAmount: number;
  balance: number;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
  daysOverdue: number;
  lastPaymentDate: string | null;
}

export interface CustomerStatementResult {
  summary: CustomerStatementSummaryRow[];
  invoices: CustomerStatementInvoiceRow[];
}