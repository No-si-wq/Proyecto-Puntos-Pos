import prisma from "../../core/prisma";
import { CreateWarehouseInput, UpdateWarehouseInput } from "./warehouse";

export class WarehouseService {

  static async getAll() {
    return prisma.warehouse.findMany({
      where: { active: true },
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

  static async toggleActive(id: number, active: boolean) {
    const hasSales = await prisma.sale.count({ where: { warehouseId: id } });

    if (hasSales > 0) {
      throw new Error("No se puede eliminar almacén con ventas asociadas");
    }
    return prisma.warehouse.update({
      where: { id },
      data: { active },
    });
  }
}