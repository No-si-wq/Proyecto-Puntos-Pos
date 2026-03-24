import prisma from "../../core/prisma";
import {
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierError,
} from "./supplier";

export class SupplierService {
  static async list(
    params: { search?: string }
  ) {

    const { search } = params;

    return prisma.supplier.findMany({
      where: { 
        active: true,
        ...(search && {
          OR: [
            {
              rtn: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: search,
                mode: "insensitive",
              }
            },
          ],
        }),
       },
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
      return await prisma.supplier.create({data});
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

  static async toggleActive(id: number, active: boolean) {
    return prisma.supplier.update({
      where: { id },
      data: { active } 
    });
  }
}