import { create } from "zustand";
import type { Product } from "../types/product";

export type DiscountType =
  | "NONE"
  | "PERCENTAGE"
  | "FIXED";

export interface SaleCartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;

  discountType: DiscountType;
  discountValue: number;

  grossLine: number;
  discountAmount: number;
  lineSubtotal: number;
}

interface SaleCartState {
  items: SaleCartItem[];

  addProduct: (product: Product) => void;

  updateQuantity: (
    productId: number,
    quantity: number
  ) => void;

  updateDiscount: (
    productId: number,
    discountType: DiscountType,
    discountValue: number
  ) => void;

  removeProduct: (productId: number) => void;

  clear: () => void;

  grossSubtotal: () => number;

  subtotal: () => number;
}

function calculateItem(
  item: Omit<
    SaleCartItem,
    "grossLine" | "discountAmount" | "lineSubtotal"
  >
): SaleCartItem {
  const grossLine = item.price * item.quantity;

  let discountAmount = 0;

  if (item.discountType === "PERCENTAGE") {
    discountAmount =
      grossLine * (item.discountValue / 100);
  }

  if (item.discountType === "FIXED") {
    discountAmount = item.discountValue;
  }

  if (discountAmount > grossLine) {
    discountAmount = grossLine;
  }

  const lineSubtotal = grossLine - discountAmount;

  return {
    ...item,
    grossLine,
    discountAmount,
    lineSubtotal,
  };
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
          const updated = calculateItem({
            ...existing,
            quantity: existing.quantity + 1,
          });

          return {
            items: state.items.map((i) =>
              i.productId === product.id
                ? updated
                : i
            ),
          };
        }

        const newItem = calculateItem({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          discountType: "NONE",
          discountValue: 0,
        });

        return {
          items: [...state.items, newItem],
        };
      }),

    updateQuantity: (productId, quantity) =>
      set((state) => ({
        items: state.items.map((i) =>
          i.productId === productId
            ? calculateItem({
                ...i,
                quantity:
                  quantity > 0 ? quantity : 1,
              })
            : i
        ),
      })),

    updateDiscount: (
      productId,
      discountType,
      discountValue
    ) =>
      set((state) => ({
        items: state.items.map((i) =>
          i.productId === productId
            ? calculateItem({
                ...i,
                discountType,
                discountValue:
                  discountValue >= 0
                    ? discountValue
                    : 0,
              })
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

    grossSubtotal: () =>
      get().items.reduce(
        (sum, i) => sum + i.grossLine,
        0
      ),

    subtotal: () =>
      get().items.reduce(
        (sum, i) => sum + i.lineSubtotal,
        0
      ),
  }));