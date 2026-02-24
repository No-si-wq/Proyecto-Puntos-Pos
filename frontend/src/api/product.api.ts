import http from "./http";
import type {
  Product,
  ProductWithContext,
  CreateProductDTO,
  UpdateProductDTO,
  ApiProduct,
} from "../types/product";
import { mapProduct } from "../types/product";

export async function getProducts() {
  const { data } = await http.get<Product[]>("/products");
  return data;
}

export async function getProductsByWarehouse() {
  const { data } =
    await http.get<ProductWithContext[]>(
      "/products/by-warehouse"
    );

  return data;
}

export async function getProduct(id: number) {
  const { data } = await http.get<Product>(`/products/${id}`);
  return data;
}

export async function createProduct(payload: CreateProductDTO) {
  const { data } = await http.post<Product>("/products", payload);
  return data;
}

export async function updateProduct(id: number, payload: UpdateProductDTO) {
  const { data } = await http.put<Product>(`/products/${id}`, payload);
  return data;
}

export async function getProductByBarcode(code: string): Promise<Product | null> {
  const { data } = await http.get<ApiProduct>(`/products/by-barcode/${code}`);
  return mapProduct(data);
}

export async function toggleProductActive(id: number, active: boolean) {
  await http.patch(`/products/${id}/activate`, { active });
}