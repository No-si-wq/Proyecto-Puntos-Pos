import type { BaseItem } from "./base";

export interface CartProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
}

export interface CartItem extends BaseItem {
  product: CartProduct;
}

export interface CartItemWithExpiration extends CartItem {
  expiresAt?: string | null;
}

export interface CartTableProps<T extends CartItem> {
  items: T[];

  onQuantityChange: (
    productId: number,
    quantity: number
  ) => void;

  onRemove: (productId: number) => void;

  extraColumns?: any[];
}