import { authStore } from "../store/auth.store";

export function useRequiredWarehouse() {
  return authStore((s) => s.activeWarehouseId);
}