import { create } from "zustand";
import type { Product } from "../types/product";

export interface SaleCartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

interface SaleCartState {
  items: SaleCartItem[];

  addProduct: (product: Product) => void;

  updateQuantity: (
    productId: number,
    quantity: number
  ) => void;

  removeProduct: (productId: number) => void;

  clear: () => void;

  total: () => number;
}

export const saleCartStore =
  create<SaleCartState>((set, get) => ({
    items: [],

    addProduct: (product) =>
      set((state) => {
        const existing = state.items.find(
          (i) => i.productId === product.id
        );

        if (existing) {
          return {
            items: state.items.map((i) =>
              i.productId === product.id
                ? {
                    ...i,
                    quantity: i.quantity + 1,
                  }
                : i
            ),
          };
        }

        return {
          items: [
            ...state.items,
            {
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity: 1,
            },
          ],
        };
      }),

    updateQuantity: (productId, quantity) =>
      set((state) => ({
        items: state.items.map((i) =>
          i.productId === productId
            ? {
                ...i,
                quantity:
                  quantity > 0
                    ? quantity
                    : 1,
              }
            : i
        ),
      })),

    removeProduct: (productId) =>
      set((state) => ({
        items: state.items.filter(
          (i) => i.productId !== productId
        ),
      })),

    clear: () => set({ items: [] }),

    total: () =>
      get().items.reduce(
        (sum, i) =>
          sum + i.price * i.quantity,
        0
      ),
  }));