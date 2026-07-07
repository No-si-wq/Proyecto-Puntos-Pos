import { create } from "zustand";
import type { Product } from "../../products/types/product";

export interface PurchaseCartItem {
  productId: number;
  name: string;
  quantity: number;
  cost: number;
  lotNumber?: string | null;
  expiresAt?: Date | null;
}

interface PurchaseCartState {
  items: PurchaseCartItem[];

  addProduct: (
    product: Product,
    costOverride?: number,
    options?: {
      lotNumber?: string | null;
      expiresAt?: Date | null;
    }
  ) => void;

  addImportedItem: (
    product: Product,
    quantity: number,
    cost: number,
    lotNumber?: string | null,
    expiresAt?: Date | null
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
  updateLot: (productId: number, lot: string) => void;
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
              lotNumber: options?.lotNumber,
              expiresAt:
                options?.expiresAt ??
                null,
            },
          ],
        };
      }),

    addImportedItem: (product, quantity, cost, lotNumber, expiresAt) =>
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
                    quantity: i.quantity + quantity,
                    cost,
                    lotNumber: lotNumber ?? i.lotNumber,
                    expiresAt: expiresAt ?? i.expiresAt,
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
              quantity,
              cost,
              lotNumber,
              expiresAt: expiresAt ?? null,
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

    updateLot: (productId, lot) =>
      set((state) => ({
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, lotNumber: lot } : i
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