import { CategoryRepository } from "./category.repository";
import { CategoryError } from "../types/category";
import prisma from "../config/prisma";

export class CategoryHierarchyService {
  static async createHierarchy(params: {
    rootCategoryId: number;
    levels: string[];
  }) {
    const { rootCategoryId, levels } = params;

    if (!levels?.length) {
      throw new Error(CategoryError.EMPTY_LEVELS);
    }

    return prisma.$transaction(async (tx) => {
      const root = await tx.category.findFirst({
        where: { id: rootCategoryId, active: true },
      });

      if (!root) {
        throw new Error(CategoryError.ROOT_NOT_FOUND);
      }

      let parentId = root.id;
      let lastNode = null;

      for (const rawName of levels) {
        const name = rawName.trim();
        if (!name) continue;

        const existing = await tx.category.findFirst({
          where: { name, parentId, active: true },
        });

        if (existing) {
          parentId = existing.id;
          lastNode = existing;
          continue;
        }

        const created = await tx.category.create({
          data: { name, parentId, active: true },
        });

        parentId = created.id;
        lastNode = created;
      }

      return lastNode;
    });
  }

  static buildTree(flatCategories: any[]) {
    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const cat of flatCategories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of flatCategories) {
      if (cat.parentId) {
        const parent = map.get(cat.parentId);
        if (parent) {
          parent.children.push(map.get(cat.id));
        }
      } else {
        roots.push(map.get(cat.id));
      }
    }

    return roots;
  }

  static async findTree() {
    const categories = await CategoryRepository.findAllActive();
    return this.buildTree(categories);
  }

  static async findSubtree(categoryId: number) {
    const root = await CategoryRepository.findActiveById(categoryId);

    if (!root) {
      throw new Error(CategoryError.CATEGORY_NOT_FOUND);
    }

    const all = await CategoryRepository.findAllActive();
    const tree = this.buildTree(all);

    const findNode = (nodes: any[]): any => {
      for (const node of nodes) {
        if (node.id === categoryId) return node;
        const found = findNode(node.children);
        if (found) return found;
      }
    };

    return findNode(tree);
  }
}