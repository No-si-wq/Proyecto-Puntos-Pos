import { create } from "zustand";
import type { Product } from "../../products/types/product";

export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED";

export interface SaleCartItem {
  productId: number;
  name: string;
  price: number;
  tax: number;
  quantity: number;
  priceListId?: number;

  discountType: DiscountType;
  discountValue: number;

  grossLine: number;      
  discountAmount: number; 
  lineSubtotal: number;   
  taxAmount: number;      
  lineTotal: number;      
}

interface SaleCartState {
  items: SaleCartItem[];
  commissionPercent: number | undefined;

  addProduct: (product: Product, overridePrice?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateDiscount: (productId: number, discountType: DiscountType, discountValue: number) => void;
  updatePrice: (productId: number, price: number) => void;
  updatePriceList: (productId: number, priceListId: number | undefined) => void;
  removeProduct: (productId: number) => void;
  clear: () => void;
  setCommissionPercent: (percent: number | undefined) => void;

  grossSubtotal: () => number;  
  subtotal: () => number;       
  totalTax: () => number;       
  total: () => number;          
  totalCommission: () => number;
}

function calculateItem(
  item: Omit<SaleCartItem, "grossLine" | "discountAmount" | "lineSubtotal" | "taxAmount" | "lineTotal">
): SaleCartItem {
  const grossLine = item.price * item.quantity;

  let discountAmount = 0;

  if (item.discountType === "PERCENTAGE") {
    if (item.discountValue > 100) discountAmount = grossLine;
    else discountAmount = grossLine * (item.discountValue / 100);
  }

  if (item.discountType === "FIXED") {
    discountAmount = Math.min(item.discountValue, grossLine);
  }

  const lineSubtotal = grossLine - discountAmount;

  const taxAmount = lineSubtotal * item.tax;

  const lineTotal = lineSubtotal + taxAmount;

  return { ...item, grossLine, discountAmount, lineSubtotal, taxAmount, lineTotal };
}

export const saleCartStore = create<SaleCartState>((set, get) => ({
  items: [],
  commissionPercent: undefined,

  addProduct: (product, overridePrice) =>
    set((state) => {
      const price = overridePrice ?? Number(product.price);
      const tax = Number(product.tax);
      const existing = state.items.find((i) => i.productId === product.id);

      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id
              ? calculateItem({ ...existing, price, tax, quantity: existing.quantity + 1 })
              : i
          ),
        };
      }

      return {
        items: [
          ...state.items,
          calculateItem({
            productId: product.id,
            name: product.name,
            price,
            tax,
            quantity: 1,
            priceListId: undefined,
            discountType: "NONE",
            discountValue: 0,
          }),
        ],
      };
    }),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? calculateItem({ ...i, quantity: quantity > 0 ? quantity : 1 })
          : i
      ),
    })),

  updateDiscount: (productId, discountType, discountValue) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? calculateItem({ ...i, discountType, discountValue: Math.max(discountValue, 0) })
          : i
      ),
    })),

  updatePrice: (productId, price) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? calculateItem({ ...i, price }) : i
      ),
    })),

  updatePriceList: (productId, priceListId) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, priceListId } : i
      ),
    })),

  removeProduct: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  clear: () => set({ items: [] }),

  setCommissionPercent: (percent) => set({ commissionPercent: percent }),

  grossSubtotal: () => get().items.reduce((sum, i) => sum + i.grossLine, 0),

  subtotal: () => get().items.reduce((sum, i) => sum + i.lineSubtotal, 0),

  totalTax: () => get().items.reduce((sum, i) => sum + i.taxAmount, 0),

  total: () => get().items.reduce((sum, i) => sum + i.lineTotal, 0),

  totalCommission: () => {
    const percent = get().commissionPercent;
    if (!percent) return 0;
    return get().items.reduce((sum, i) => sum + (i.lineSubtotal * percent) / 100, 0);
  },
}));