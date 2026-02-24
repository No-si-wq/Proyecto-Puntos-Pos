import { CategoryRepository } from "./category.repository";
import { CategoryError } from "../types/category";
import { CategoryHierarchyService } from "./category.hierarchy.service";

export class CategoryService {
  static create(data: {
    name: string;
    parentId?: number | null;
    active?: boolean;
  }) {
    return CategoryRepository.create(data);
  }

  static async remove(id: number) {
    const childrenCount =
      await CategoryRepository.countActiveChildren(id);

    if (childrenCount > 0) {
      throw new Error(CategoryError.CATEGORY_HAS_CHILDREN);
    }

    return CategoryRepository.update(id, { active: false });
  }

  static toggleActive(id: number, active: boolean) {
    return CategoryRepository.update(id, { active });
  }

  static findChildren(parentId: number | null) {
    return CategoryRepository.findChildren(parentId);
  }

  static findTree() {
    return CategoryHierarchyService.findTree();
  }

  static findSubtree(id: number) {
    return CategoryHierarchyService.findSubtree(id);
  }

  static createHierarchy(params: {
    rootCategoryId: number;
    levels: string[];
  }) {
    return CategoryHierarchyService.createHierarchy(params);
  }
}