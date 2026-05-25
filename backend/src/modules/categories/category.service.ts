import prisma from "../../core/prisma";
import { CategoryRepository } from "./category.repository";
import { CategoryError } from "./category";

export class CategoryService {

  static create(data: {
    tenantId: number;
    name: string;
    parentId?: number | null;
    active?: boolean;
  }) {
    return CategoryRepository.create(data);
  }

  static async toggleActive(id: number, tenantId: number, active: boolean) {
    const children =
      await CategoryRepository.countActiveChildren(id);

    if (children > 0) {
      throw new Error(CategoryError.CATEGORY_HAS_CHILDREN);
    }

    return CategoryRepository.update(id, tenantId, { active });
  }

  static findChildren(parentId: number | null, tenantId: number) {
    return CategoryRepository.findChildren(parentId, tenantId);
  }

  static async findTree(tenantId: number) {
    const categories = await CategoryRepository.findAllActive(tenantId);
    return this.buildTree(categories);
  }

  static async findSubtree(categoryId: number, tenantId: number) {
    const root = await CategoryRepository.findActiveById(categoryId, tenantId);

    if (!root) {
      throw new Error(CategoryError.CATEGORY_NOT_FOUND);
    }

    const all = await CategoryRepository.findAllActive(tenantId);
    const tree = this.buildTree(all);

    return this.findNode(tree, categoryId);
  }

  static async createHierarchy(params: {
    tenantId: number;
    rootCategoryId: number;
    levels: string[];
  }) {
    const { tenantId, rootCategoryId, levels } = params;

    if (!levels?.length) {
      throw new Error(CategoryError.EMPTY_LEVELS);
    }

    return prisma.$transaction(async (tx) => {
      const root = await tx.category.findFirst({
        where: { id: rootCategoryId, tenantId, active: true },
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
          where: { name, parentId, tenantId, active: true },
        });

        if (existing) {
          parentId = existing.id;
          lastNode = existing;
          continue;
        }

        const created = await tx.category.create({
          data: { tenantId, name, parentId, active: true },
        });

        parentId = created.id;
        lastNode = created;
      }

      return lastNode;
    });
  }

  static findById(id: number, tenantId: number) {
    return CategoryRepository.findById(id, tenantId);
  }

  static update(id: number, tenantId: number, data: any) {
    return CategoryRepository.update(id, tenantId, data);
  }

  static async importFromPaths(tenantId: number, paths: string[][]) {

    return prisma.$transaction(async (tx) => {

      for (const row of paths) {
        if (!row.length) continue;

        const [rootName, ...levels] = row;

        let root = await tx.category.findFirst({
          where: {
            tenantId,
            name: rootName,
            parentId: null,
            active: true,
          },
        });

        if (!root) {
          root = await tx.category.create({
            data: {
              tenantId,
              name: rootName,
              parentId: null,
              active: true,
            },
          });
        }

        let parentId = root.id;

        for (const levelName of levels) {

          const name = levelName.trim();
          if (!name) continue;

          const existing = await tx.category.findFirst({
            where: {
              tenantId,
              name,
              parentId,
              active: true,
            },
          });

          if (existing) {
            parentId = existing.id;
            continue;
          }

          const created = await tx.category.create({
            data: {
              tenantId,
              name,
              parentId,
              active: true,
            },
          });

          parentId = created.id;
        }
      }

    });
  }

  private static buildTree(categories: any[]) {
    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
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

  private static findNode(nodes: any[], id: number): any {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = this.findNode(node.children, id);
      if (found) return found;
    }
  }
}