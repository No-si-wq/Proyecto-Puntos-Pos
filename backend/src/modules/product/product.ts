export type SKU = string;
export type Barcode = string;
export type CategoryId = number;

export interface ProductPriceInput {
  priceListId: number;
  price: number;
}

export interface ProductBase {
  sku: SKU;
  name: string;
  description?: string;
  laboratory?: string;
  cost: number;
  price: number;
  tax: number;
  observations?: string;
  categoryId: CategoryId;
  prices: ProductPriceInput[];
  barcodes?: Barcode[];
  imageUrl?: string | null;
}

export type CreateProductInput = ProductBase;

export type UpdateProductInput = Partial<Omit<ProductBase, "sku">> & {
  sku?: SKU;
  active?: boolean;
};

export enum ProductError {
  INVALID_CATEGORY = "INVALID_CATEGORY",
  DUPLICATE_BARCODE = "DUPLICATE_BARCODE",
  CATEGORY_NOT_LEAF = "CATEGORY_NOT_LEAF",
  INVALID_PRICE_LIST = "INVALID_PRICE_LIST",
}