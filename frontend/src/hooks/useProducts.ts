import { useEffect, useState, useCallback } from "react";
import {
  getProducts,
  getProductByBarcode,
  createProduct,
  updateProduct,
  toggleProductActive
} from "../api/product.api";
import type {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
} from "../types/product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {

    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function findByBarcode(code: string): Promise<Product | null> {
    return await getProductByBarcode(code);
  }

  async function create(payload: CreateProductDTO) {
    await createProduct(payload);
    await load();
  }

  async function update(id: number, payload: UpdateProductDTO) {
    await updateProduct(id, payload);
    await load();
  }

  async function toggleActive(id: number, active: boolean) {
    await toggleProductActive(id, active);
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
  };
}