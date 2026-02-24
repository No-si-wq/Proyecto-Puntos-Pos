import type { Category } from "./category";

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;

  barcodes: string[];

  categoryId: number;
  category: Category;

  active: boolean;
}

export interface ProductWithContext extends Product {
  stock: number;
}

export interface ProductFormValues {
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost: number;

  barcodes?: string[];

  categoryPath: number[];
  active?: boolean;
}

export interface ProductFormProps {
  isEdit: boolean;
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
}

export interface CreateProductDTO {
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  categoryId: number;

  barcodes?: string[];
}

export interface UpdateProductDTO {
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  cost?: number;
  categoryId?: number;
  active?: boolean;

  barcodes?: string[];
}

export interface ApiProduct extends Omit<Product, "barcodes"> {
  barcodes?: { code: string }[];
  [key: string]: any;
}

export function mapProduct(apiProduct: ApiProduct): Product {
  return {
    ...apiProduct,
    barcodes: apiProduct.barcodes?.map(b => b.code) ?? [],
  };
}