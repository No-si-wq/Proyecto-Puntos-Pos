import http from "./http";
import type { PurchaseLotReportItem, PurchaseLotsParams } from "../types/report";

export async function getPurchaseLotsReport(
  params?: PurchaseLotsParams
) {
  const { data } = await http.get<PurchaseLotReportItem[]>(
    "/reports/purchase", {
      params,
    });
  return data;
}