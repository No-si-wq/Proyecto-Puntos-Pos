import http from "./http";
import type { PurchaseLotReportItem, PurchaseLotsParams } from "../types/report";

export interface KardexParams {
  productId: number;
  warehouseId: number;
  from: string;
  to: string;
}

export interface ProfitParams {
  warehouseId: number;
  from: string;
  to: string;
}

export async function getPurchaseLotsReport(
  params?: PurchaseLotsParams
) {
  const { data } = await http.get<PurchaseLotReportItem[]>(
    "/reports/purchase", {
      params,
    });
  return data;
}

export const getKardex = (params: KardexParams) =>
  http.get("/reports/kardex", { params });

export const getProfitReport = (params: ProfitParams) =>
  http.get("/reports/profit", { params });