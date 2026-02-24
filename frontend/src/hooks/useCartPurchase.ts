import { purchaseCartStore } from "../store/purchaseCart.store";
import type { Product } from "../types/product";

export function useCartPurchase() {
  const cart = purchaseCartStore();

  return {
    items: cart.items,

    addProduct: (
      product: Product,
      costOverride?: number,
      options?: {
        lot?: string;
        expiresAt?: Date | null;
      }
    ) =>
      cart.addProduct(
        product,
        costOverride,
        options
      ),

    updateQuantity: cart.updateQuantity,
    updateCost: cart.updateCost,
    updateExpiration:
      cart.updateExpiration,
    removeProduct: cart.removeProduct,
    clear: cart.clear,
    total: cart.total,
  };
}