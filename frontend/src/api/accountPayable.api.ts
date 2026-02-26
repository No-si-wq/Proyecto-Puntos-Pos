import http from "./http";

export const getPayables = (params?: any) =>
  http.get("/account-payable", { params });

export const registerPayablePayment = (
  id: number,
  data: { amount: number; note?: string }
) =>
  http.post(
    `/account-payable/${id}/payments`,
    data
  );