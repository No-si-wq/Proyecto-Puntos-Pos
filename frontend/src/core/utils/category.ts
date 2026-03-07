import type { Category } from "../../modules/categories/category";

export function buildCategoryMap(categories: Category[]): Map<number, Category> {
  const map = new Map<number, Category>();

  function traverse(nodes: Category[]) {
    for (const node of nodes) {
      map.set(node.id, node);
      if (node.children?.length) {
        traverse(node.children);
      }
    }
  }

  traverse(categories);

  return map;
}

export function formatCategoryBreadcrumbFromPath(
  path: Category[]
): string {
  if (!path.length) return "-";
  return path.map(c => c.name).join(" > ");
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

export function buildCategoryBreadcrumb(
  categories: Category[],
  categoryId: number
): string {
  const path = buildCategoryPath(categories, categoryId);

  if (!path.length) return "-";

  return path.map(c => c.name).join(" > ");
}