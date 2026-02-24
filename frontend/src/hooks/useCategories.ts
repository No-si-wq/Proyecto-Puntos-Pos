import { useEffect, useState, useCallback } from "react";
import {
  tree as fetchTree,
  subtree as fetchSubtree,
  children as fetchChildren,
  create as createCategory,
  createHierarchy as createCategoryHierarchy,
  update as updateCategory,
  remove as removeCategory,
} from "../api/category.api";

import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../types/category";

export function useCategories() {
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTree();
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
      return fetchSubtree(rootCategoryId);
    },
    []
  );

  const loadChildren = useCallback(
    async (parentId?: number): Promise<Category[]> => {
      return fetchChildren(parentId);
    },
    []
  );

  const create = useCallback(
    async (payload: CreateCategoryInput) => {
      await createCategory(payload);
      await loadTree();
    },
    [loadTree]
  );

  const createHierarchy = useCallback(
    async (rootCategoryId: number, levels: string[]) => {
      await createCategoryHierarchy({
        rootCategoryId,
        levels,
      });
      await loadTree();
    },
    [loadTree]
  );

  const update = useCallback(
    async (id: number, payload: UpdateCategoryInput) => {
      await updateCategory(id, payload);
      await loadTree();
    },
    [loadTree]
  );

  const remove = useCallback(
    async (id: number) => {
      await removeCategory(id);
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