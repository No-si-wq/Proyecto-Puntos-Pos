import { authStore } from "../auth/auth.store";

export function useRequiredWarehouse() {
  return authStore((s) => s.activeWarehouseId);
}