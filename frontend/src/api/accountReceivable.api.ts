import http from "./http";

export const getReceivables = (params?: any) =>
  http.get("/account-receivable", { params });

export const getReceivableById = (id: number) =>
  http.get(`/account-receivable/${id}`);

export const registerReceivablePayment = (
  id: number,
  data: { amount: number; note?: string }
) =>
  http.post(
    `/account-receivable/${id}/payments`,
    data
  );