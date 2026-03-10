import { saleCartStore } from "./saleCart.store";

export function useCartSale() {
  const cart = saleCartStore();

  return {
    items: cart.items,
    addProduct: cart.addProduct,
    updatePrice: cart.updatePrice,
    totalCommission: cart.totalCommission,
    updateQuantity: cart.updateQuantity,
    removeProduct: cart.removeProduct,
    updateDiscount: cart.updateDiscount,
    clear: cart.clear,
    grossSubtotal: cart.grossSubtotal,
    subtotal: cart.subtotal,
  };
}