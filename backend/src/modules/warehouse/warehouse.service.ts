import prisma from "../../core/prisma";
import { CreateWarehouseInput, UpdateWarehouseInput } from "./warehouse";

export class WarehouseService {

  static async getAll(tenantId: number) {
    return prisma.warehouse.findMany({
      where: { active: true, tenantId },
      orderBy: { name: "asc" },
    });
  }

  static async getById(id: number, tenantId: number) {
    return prisma.warehouse.findUnique({
      where: { id, tenantId },
    });
  }

  static async create(data: CreateWarehouseInput, tenantId: number) {
    return prisma.warehouse.create({
      data: {
        name: data.name,
        tenantId,
      },
    });
  }

  static async update(id: number, data: UpdateWarehouseInput, tenantId: number) {
    return prisma.warehouse.update({
      where: { id, tenantId },
      data,
    });
  }

  static async toggleActive(id: number, tenantId: number, active: boolean) {
    const hasSales = await prisma.sale.count({ where: { warehouseId: id } });

    if (hasSales > 0) {
      throw new Error("No se puede eliminar almacén con ventas asociadas");
    }
    return prisma.warehouse.update({
      where: { id, tenantId },
      data: { active },
    });
  }
}