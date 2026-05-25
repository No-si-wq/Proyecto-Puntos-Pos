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