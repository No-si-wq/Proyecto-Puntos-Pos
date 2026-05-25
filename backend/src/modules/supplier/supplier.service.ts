import prisma from "../../core/prisma";
import {
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierError,
} from "./supplier";

export class SupplierService {
  static async list(tenantId: number) {
    return prisma.supplier.findMany({
      where: { active: true, tenantId },
      orderBy: { name: "asc" },
    });
  }

  static async getById(id: number, tenantId: number) {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });
  }

  static async create(data: CreateSupplierInput, tenantId: number) {
    if (!data.name || data.name.trim().length < 3) {
      throw new Error(SupplierError.INVALID_SUPPLIER);
    }

    try {
      return await prisma.supplier.create({
        data: {
          ...data,
          tenantId,
        },
      });
    } catch {
      throw new Error(SupplierError.DUPLICATE_SUPPLIER);
    }
  }

  static async update(id: number, data: UpdateSupplierInput, tenantId: number) {
    const exists = await prisma.supplier.findUnique({ where: { id, tenantId } });

    if (!exists) {
      throw new Error(SupplierError.SUPPLIER_NOT_FOUND);
    }

    return prisma.supplier.update({
      where: { id, tenantId },
      data,
    });
  }

  static async toggleActive(id: number, tenantId: number, active: boolean) {
    return prisma.supplier.update({
      where: { id, tenantId },
      data: { active } 
    });
  }
}