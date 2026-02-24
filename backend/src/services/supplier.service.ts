import prisma from "../config/prisma";
import {
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierError,
} from "../types/supplier";

export class SupplierService {
  static async list() {
    return prisma.supplier.findMany({
      orderBy: { name: "asc" },
    });
  }

  static async getById(id: number) {
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

  static async create(data: CreateSupplierInput) {
    if (!data.name || data.name.trim().length < 3) {
      throw new Error(SupplierError.INVALID_SUPPLIER);
    }

    try {
      return await prisma.supplier.create({
        data: {
          name: data.name.trim(),
          email: data.email,
          phone: data.phone,
        },
      });
    } catch {
      throw new Error(SupplierError.DUPLICATE_SUPPLIER);
    }
  }

  static async update(id: number, data: UpdateSupplierInput) {
    const exists = await prisma.supplier.findUnique({ where: { id } });

    if (!exists) {
      throw new Error(SupplierError.SUPPLIER_NOT_FOUND);
    }

    return prisma.supplier.update({
      where: { id },
      data,
    });
  }

  static async deactivate(id: number) {
    return this.update(id, { active: false });
  }
}