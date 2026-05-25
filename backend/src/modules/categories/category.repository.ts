import prisma from "../../core/prisma";
import { Prisma } from "@prisma/client";

export class CategoryRepository {

  static create(data: Prisma.CategoryUncheckedCreateInput) {
    return prisma.category.create({ data });
  }

  static findById(id: number, tenantId: number) {
    return prisma.category.findFirst({
      where: { id, tenantId },
    });
  }

  static findActiveById(id: number, tenantId: number) {
    return prisma.category.findFirst({
      where: { id, tenantId, active: true },
    });
  }

  static findChildren(parentId: number | null, tenantId: number) {
    return prisma.category.findMany({
      where: { parentId, tenantId, active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        parentId: true,
        _count: { select: { children: true } },
      },
    });
  }

  static findAllActive(tenantId: number) {
    return prisma.category.findMany({
      where: { tenantId, active: true },
      orderBy: { name: "asc" },
    });
  }

  static update(id: number, tenantId: number, data: Prisma.CategoryUncheckedUpdateInput) {
    return prisma.category.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  static countActiveChildren(parentId: number) {
    return prisma.category.count({
      where: { parentId, active: true },
    });
  }
}