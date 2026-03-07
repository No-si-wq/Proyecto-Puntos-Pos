import { useEffect, useState, useCallback } from "react";
import http from "../../core/http/http";
import type {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  ApiProduct,
} from "./product";
import { mapProduct } from "./product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  async function importExcel(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    await http.post("/products/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    await load();
  }

  const load = useCallback(async () => {

    setLoading(true);
    try {
      const { data } = await http.get<Product[]>("/products");
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function findByBarcode(code: string): Promise<Product | null> {
    const { data } = await http.get<ApiProduct>(`/products/by-barcode/${code}`);
    return mapProduct(data);
  }

  async function create(payload: CreateProductDTO) {
    await http.post<Product>("/products", payload);
    await load();
  }

  async function update(id: number, payload: UpdateProductDTO) {
     await http.put<Product>(`/products/${id}`, payload);
    await load();
  }

  async function toggleActive(id: number, active: boolean) {
    await  http.patch(`/products/${id}/activate`, { active });
    await load();
  }

  return {
    loading,
    products,
    reload: load,
    findByBarcode,
    create,
    update,
    toggleActive,
    importExcel,
  };
}