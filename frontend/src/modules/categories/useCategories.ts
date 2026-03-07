import { useEffect, useState, useCallback } from "react";
import http from "../../core/http/http";

import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category";

export function useCategories() {
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<Category[]>(
        "/categories/tree"
      );
      setCategoryTree(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const loadSubtree = useCallback(
    async (rootCategoryId: number): Promise<Category> => {
      const { data } = await http.get<Category>(
        `/categories/${rootCategoryId}/subtree`
      );
      return data;
    },
    []
  );

  const loadChildren = useCallback(
    async (parentId?: number): Promise<Category[]> => {
      const id = parentId ?? "root";
      const { data } = await http.get<Category[]>(
        `/categories/${id}/children`
      );
      return data;
    },
    []
  );

  const create = useCallback(
    async (payload: CreateCategoryInput) => {
      await http.post("/categories", payload);
      await loadTree();
    },
    [loadTree]
  );

  const createHierarchy = useCallback(
    async (rootCategoryId: number, levels: string[]) => {
      await http.post("/categories/hierarchy", {
        rootCategoryId,
        levels,
      });
      await loadTree();
    },
    [loadTree]
  );

  const update = useCallback(
    async (id: number, payload: UpdateCategoryInput) => {
      await http.put(`/categories/${id}`, payload);
      await loadTree();
    },
    [loadTree]
  );

  const remove = useCallback(
    async (id: number) => {
      await http.delete(`/categories/${id}`);
      await loadTree();
    },
    [loadTree]
  );

  return {
    categoryTree,
    loading,

    reload: loadTree,
    loadSubtree,
    loadChildren,

    create,
    createHierarchy,
    update,
    remove,
  };
}