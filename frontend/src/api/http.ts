import axios from "axios";
import { refresh } from "./auth.api";
import { authStore } from "../store/auth.store";

const baseURL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL
  : "/api"

export const api = axios.create({
  baseURL,
});

const http = axios.create({
  baseURL,
  timeout: 80000,
});

let isRefreshing = false;
let failedQueue: any[] = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((p) =>
    error ? p.reject(error) : p.resolve(token)
  );
  failedQueue = [];
}

http.interceptors.request.use((config) => {
  const { accessToken, hasHydrated } = authStore.getState();

  if (!hasHydrated) {
    return config
  }

  if (typeof accessToken === "string" && accessToken.length > 0) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  } else {
    delete config.headers.Authorization;
  }
  if (config.url?.includes("/auth/login") || config.url?.includes("/auth/refresh")) {
    return config
  }

  return config;
});

http.interceptors.request.use((config) => {
  const warehouseId = authStore.getState().activeWarehouseId;

  if (warehouseId) {
    config.headers["x-warehouse-id"] = warehouseId;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      window.dispatchEvent(
        new Event("api-offline")
      );
    }

    if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes("/auth/login") &&
        !originalRequest.url?.includes("/auth/refresh") &&
        !originalRequest.url?.includes("/auth/logout")
      ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return http(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = authStore.getState().refreshToken;
        if (!refreshToken) throw error;

        const tokens = await refresh(refreshToken);

        authStore.getState().setTokens(
          tokens.accessToken,
          tokens.refreshToken
        );

        processQueue(null, tokens.accessToken);

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return http(originalRequest);
      } catch (err) {
        processQueue(err, null);
        authStore.getState().logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default http;