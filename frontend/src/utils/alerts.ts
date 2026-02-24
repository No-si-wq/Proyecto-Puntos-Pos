import type { AlertPriority } from "../types/alert";

export const priorityOrder: Record<AlertPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export function getExpiringPriority(daysLeft: number): AlertPriority {
  if (daysLeft < 0) return "CRITICAL";
  if (daysLeft <= 30) return "HIGH";
  if (daysLeft <= 60) return "MEDIUM";
  return "LOW";
}

export function getStockPriority(stock: number): AlertPriority {
  if (stock === 0) return "CRITICAL";
  if (stock <= 8) return "HIGH";
  if (stock <= 15) return "MEDIUM";
  return "LOW";
}