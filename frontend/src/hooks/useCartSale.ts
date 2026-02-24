import { saleCartStore } from "../store/saleCart.store";

export function useCartSale() {
  const cart = saleCartStore();

  return {
    items: cart.items,
    addProduct: cart.addProduct,
    updateQuantity: cart.updateQuantity,
    removeProduct: cart.removeProduct,
    clear: cart.clear,
    total: cart.total,
  };
}