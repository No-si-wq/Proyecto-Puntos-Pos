import type { Category } from "../types/category";

export function formatCategoryBreadcrumb(category?: Category | null): string {
  if (!category) return "-";

  if (category.parent) {
    return `${category.parent.name} > ${category.name}`;
  }

  return category.name;
}

export function getChildren(
  nodes: Category[],
  parentId: number | null
): Category[] {
  if (parentId === null) {
    return nodes;
  }

  for (const node of nodes) {
    if (node.id === parentId) {
      return node.children ?? [];
    }

    if (node.children?.length) {
      const found = getChildren(node.children, parentId);
      if (found.length) {
        return found;
      }
    }
  }

  return [];
}

export function buildCategoryPath(
  categories: Category[],
  categoryId: number
): Category[] {

  function findPath(
    nodes: Category[],
    targetId: number,
    path: Category[] = []
  ): Category[] | null {
    for (const node of nodes) {
      const newPath = [...path, node];

      if (node.id === targetId) {
        return newPath;
      }

      if (node.children?.length) {
        const result = findPath(
          node.children,
          targetId,
          newPath
        );
        if (result) return result;
      }
    }

    return null;
  }

  return findPath(categories, categoryId) ?? [];
}

export function buildCategoryPathFromMap(
  map: Map<number, Category>,
  categoryId: number
): Category[] {
  const path: Category[] = [];
  let current = map.get(categoryId);

  while (current) {
    path.unshift(current);
    current = current.parentId
      ? map.get(current.parentId)
      : undefined;
  }

  return path;
}