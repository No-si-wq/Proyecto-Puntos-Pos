export interface KardexPagination {
  page: number;
  pageSize: number;
}

export type ProfitDetailRow = {
  saleNumber: string;
  date: Date;
  total: number;
  cogs: number;
  profit: number;
  margin: number;
  customer: string;
  seller: string;
};

export type ProfitSummaryRow = {
  seller: string;
  totalSales: number | null;
  totalCogs: number | null;
  totalProfit: number | null;
  margin: number | null;
};

export type CustomerStatementSummaryRow = {
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
};

export type CustomerStatementInvoiceRow = {
  id: number;
  saleNumber: string;
  saleDate: Date;
  dueDate: Date | null;
  total: number;
  paidAmount: number;
  balance: number;
  status: string;
  daysOverdue: number;
  lastPaymentDate: Date | null;
};