export type SKU = string;
export type Barcode = string;
export type CategoryId = number;

export interface ProductBase {
  sku: SKU;
  name: string;
  description?: string;
  price: number;
  cost: number;
  categoryId: CategoryId;
  barcodes?: Barcode[];
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
}