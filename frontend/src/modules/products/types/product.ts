import type { UploadFile } from "antd";
import type { Category } from "../../categories/category";
import type { ProductPrice } from "../../priceLists/types/pricelist";

export interface productSearch {
  search?: string,
  onlyInactive?: boolean,
};

export interface Barcode {
  code: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  tax: number;
  laboratory?: string;
  observations?: string;
  stock: number;
  reorderPoint: number;

  barcodes: Barcode[];

  categoryId: number;
  category: Category;

  prices: ProductPrice[];

  imageUrl?: string | null;
  active: boolean;
}

export interface ProductWithContext extends Product {
  stock: number;
}

export interface ProductFormValues
  extends Omit<Partial<Product>, "barcodes" | "categoryId" | "category"> {
  barcodes?: string[];
  categoryPath?: number[];
  imageFile?: UploadFile[];
}

export interface ProductFormProps {
  isEdit: boolean;
  initialValues?: ProductFormValues;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}

export interface CreateProductDTO {
  sku: string;
  name: string;
  description?: string;
  observations?: string;
  price: number;
  cost: number;
  tax: number;
  laboratory?: string;
  categoryId: number;

  barcodes?: string[];
}

export interface UpdateProductDTO {
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  cost?: number;
  tax: number;
  laboratory?: string;
  observations?: string;
  categoryId?: number;
  active?: boolean;

  barcodes?: string[];
}

export interface ApiProduct extends Omit<Product, "barcodes"> {
  barcodes?: (Barcode | string)[];
  [key: string]: any;
}

export function mapProduct(apiProduct: ApiProduct): Product {
  return {
    ...apiProduct,
    barcodes:
      apiProduct.barcodes?.map((barcode) =>
        typeof barcode === "string" ? { code: barcode } : barcode
      ) ?? [],
  };
}
