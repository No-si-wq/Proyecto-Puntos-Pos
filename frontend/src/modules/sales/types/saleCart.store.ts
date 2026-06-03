import { create } from "zustand";
import type { Product } from "../../products/types/product";

export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED";
export type PriceMode = "TAX_INCLUDED" | "TAX_EXCLUDED";

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
  priceMode: PriceMode;

  observations: string;
}

interface SaleCartState {
  items: SaleCartItem[];
  commissionPercent: number | undefined;
  priceMode: PriceMode;
  amountPaid: number | null;

  addProduct: (product: Product, overridePrice?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateDiscount: (productId: number, discountType: DiscountType, discountValue: number) => void;
  updatePrice: (productId: number, price: number) => void;
  updatePriceList: (productId: number, priceListId: number | undefined) => void;
  removeProduct: (productId: number) => void;
  clear: () => void;
  setCommissionPercent: (percent: number | undefined) => void;
  setPriceMode: (mode: PriceMode) => void;
  updateObservations: (productId: number, observations: string) => void;
  setAmountPaid: (amount: number | null) => void;

  grossSubtotal: () => number;  
  subtotal: () => number;       
  totalTax: () => number;       
  total: () => number;          
  totalCommission: () => number;
  totalDiscount: () => number;
}

function calculateItem(
  item: Omit<
    SaleCartItem,
    "grossLine" | "discountAmount" | "lineSubtotal" | "taxAmount" | "lineTotal" | "priceMode"
  >,
  priceMode: PriceMode
): SaleCartItem {
  const grossLine = item.price * item.quantity;

  let discountAmount = 0;
  if (item.discountType === "PERCENTAGE") {
    discountAmount = item.discountValue > 100 ? grossLine : grossLine * (item.discountValue / 100);
  }
  if (item.discountType === "FIXED") {
    discountAmount = Math.min(item.discountValue, grossLine);
  }

  // grossAfterDiscount = lo que paga el cliente antes de separar/agregar tax
  const grossAfterDiscount = grossLine - discountAmount;

  let lineSubtotal: number; // siempre = base sin impuesto
  let taxAmount: number;
  let lineTotal: number;   // siempre = lo que paga el cliente

  if (priceMode === "TAX_INCLUDED") {
    // El precio YA incluye el impuesto → extraemos la base
    lineSubtotal = item.tax > 0 ? grossAfterDiscount / (1 + item.tax) : grossAfterDiscount;
    taxAmount    = grossAfterDiscount - lineSubtotal;
    lineTotal    = grossAfterDiscount; // el cliente paga grossAfterDiscount (tax ya incluido)
  } else {
    // TAX_EXCLUDED: el precio es base → se suma el impuesto
    lineSubtotal = grossAfterDiscount;
    taxAmount    = lineSubtotal * item.tax;
    lineTotal    = lineSubtotal + taxAmount;
  }

  return { ...item, grossLine, discountAmount, lineSubtotal, taxAmount, lineTotal, priceMode };
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
              ? calculateItem({ ...existing, price, tax, quantity: existing.quantity + 1 }, get().priceMode)
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
            observations: "",
          }, get().priceMode),
        ],
      };
    }),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? calculateItem({ ...i, quantity: quantity > 0 ? quantity : 1 }, get().priceMode)
          : i
      ),
    })),

  updateDiscount: (productId, discountType, discountValue) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? calculateItem({ ...i, discountType, discountValue: Math.max(discountValue, 0) }, get().priceMode)
          : i
      ),
    })),

  updatePrice: (productId, price) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? calculateItem({ ...i, price }, get().priceMode) : i
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

    priceMode: "TAX_INCLUDED" as PriceMode,

    // Nueva acción:
    setPriceMode: (mode) => set((state) => ({
      priceMode: mode,
      items: state.items.map((i) => calculateItem(i, mode)),
    })),

    updateObservations: (productId, observations) =>
      set((s) => ({
        items: s.items.map((i) =>
          i.productId === productId ? { ...i, observations } : i
        ),
      })),

  amountPaid: null,
  setAmountPaid: (amount) => set({ amountPaid: amount }),

  clear: () => set({ items: [], amountPaid: null }),

  setCommissionPercent: (percent) => set({ commissionPercent: percent }),

  grossSubtotal: () => get().items.reduce((sum, i) => sum + i.grossLine, 0),

  subtotal: () => get().items.reduce((sum, i) => sum + i.lineSubtotal, 0),

  totalTax: () => get().items.reduce((sum, i) => sum + i.taxAmount, 0),

  total: () => get().items.reduce((sum, i) => sum + i.lineTotal, 0),

  totalDiscount: () => get().items.reduce((sum, i) => sum + i.discountAmount, 0),

  totalCommission: () => {
    const percent = get().commissionPercent;
    if (!percent) return 0;
    return get().items.reduce((sum, i) => sum + (i.lineSubtotal * percent) / 100, 0);
  },
}));
