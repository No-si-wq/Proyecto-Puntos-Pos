import { saleCartStore } from "../store/saleCart.store";

export function useCartSale() {
  const cart = saleCartStore();

  return {
    items: cart.items,
    addProduct: cart.addProduct,
    updateQuantity: cart.updateQuantity,
    removeProduct: cart.removeProduct,
    updateDiscount: cart.updateDiscount,
    clear: cart.clear,
    grossSubtotal: cart.grossSubtotal,
    subtotal: cart.subtotal,
  };
}