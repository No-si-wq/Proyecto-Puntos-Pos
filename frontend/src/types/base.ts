export interface BaseProduct {
  id: number;
  name: string;
  sku: string;
}

export interface BaseItem {
  product: BaseProduct;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}