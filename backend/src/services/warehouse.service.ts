import prisma from "../config/prisma";
import { CreateWarehouseInput, UpdateWarehouseInput } from "../types/warehouse";

export class WarehouseService {

  static async getAll() {
    return prisma.warehouse.findMany({
      orderBy: { name: "asc" },
    });
  }

  static async getById(id: number) {
    return prisma.warehouse.findUnique({
      where: { id },
    });
  }

  static async create(data: CreateWarehouseInput) {
    return prisma.warehouse.create({
      data,
    });
  }

  static async update(id: number, data: UpdateWarehouseInput) {
    return prisma.warehouse.update({
      where: { id },
      data,
    });
  }

  static async remove(id: number) {
    const hasSales = await prisma.sale.count({ where: { warehouseId: id } });

    if (hasSales > 0) {
      throw new Error("No se puede eliminar almacén con ventas asociadas");
    }
    return prisma.warehouse.update({
      where: { id },
      data: { active: false },
    });
  }
}