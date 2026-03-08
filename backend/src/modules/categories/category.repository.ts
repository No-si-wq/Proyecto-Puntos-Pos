import prisma from "../../core/prisma";
import { Prisma } from "@prisma/client";

export class CategoryRepository {

  static create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  }

  static findById(id: number) {
    return prisma.category.findUnique({
      where: { id },
    });
  }

  static findActiveById(id: number) {
    return prisma.category.findFirst({
      where: { id, active: true },
    });
  }

  static findChildren(parentId: number | null) {
    return prisma.category.findMany({
      where: { parentId, active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        parentId: true,
        _count: { select: { children: true } },
      },
    });
  }

  static findAllActive() {
    return prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }

  static update(id: number, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  static countActiveChildren(parentId: number) {
    return prisma.category.count({
      where: { parentId, active: true },
    });
  }
}