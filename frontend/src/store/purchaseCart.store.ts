import { create } from "zustand";
import type { Product } from "../types/product";

export interface PurchaseCartItem {
  productId: number;
  name: string;
  quantity: number;
  cost: number;
  lot?: string;
  expiresAt?: Date | null;
}

interface PurchaseCartState {
  items: PurchaseCartItem[];

  addProduct: (
    product: Product,
    costOverride?: number,
    options?: {
      lot?: string;
      expiresAt?: Date | null;
    }
  ) => void;

  updateQuantity: (
    productId: number,
    quantity: number
  ) => void;

  updateCost: (
    productId: number,
    cost: number
  ) => void;

  updateExpiration: (
    productId: number,
    date: Date | null
  ) => void;

  removeProduct: (productId: number) => void;
  clear: () => void;

  total: () => number;
}

export const purchaseCartStore =
  create<PurchaseCartState>((set, get) => ({
    items: [],

    addProduct: (
      product,
      costOverride,
      options
    ) =>
      set((state) => {
        const existing = state.items.find(
          (i) =>
            i.productId === product.id
        );

        if (existing) {
          return {
            items: state.items.map((i) =>
              i.productId === product.id
                ? {
                    ...i,
                    quantity:
                      i.quantity + 1,
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
              quantity: 1,
              cost:
                costOverride ??
                product.cost,
              lot: options?.lot,
              expiresAt:
                options?.expiresAt ??
                null,
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

    updateCost: (productId, cost) =>
      set((state) => ({
        items: state.items.map((i) =>
          i.productId === productId
            ? { ...i, cost }
            : i
        ),
      })),

    updateExpiration: (productId, date) =>
      set((state) => ({
        items: state.items.map((i) =>
          i.productId === productId
            ? {
                ...i,
                expiresAt: date,
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
          sum + i.cost * i.quantity,
        0
      ),
  }));