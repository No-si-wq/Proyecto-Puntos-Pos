export interface KardexPagination {
  page: number;
  pageSize: number;
}

export type ProfitSummaryRow = {
  totalSales: number | null;
  totalCogs: number | null;
  totalProfit: number | null;
  margin: number | null;
};