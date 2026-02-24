import prisma from "../config/prisma";
import { InventoryMovementType, Prisma } from "@prisma/client";
import dayjs from "dayjs";

export class InventoryService {
  static async getStock(productId: number, warehouseId: number) {
    const result = await prisma.purchaseItem.aggregate({
      where: {
        productId,
        warehouseId,
      },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity ?? 0;
  }

  static async consumeStockFIFO(
    tx: Prisma.TransactionClient,
    saleItemId: number,
    productId: number,
    warehouseId: number,
    quantity: number
  ) {
    let remaining = quantity;
    let totalCost = 0;

    const lots = await tx.purchaseItem.findMany({
      where: {
        productId,
        warehouseId,
        quantity: { gt: 0 },
      },
      orderBy: [
        { expiresAt: "asc" },
        { purchase: { createdAt: "asc" } },
      ],
    });

    for (const lot of lots) {
      if (remaining <= 0) break;

      const deduct = Math.min(lot.quantity, remaining);

      await tx.purchaseItem.update({
        where: { id: lot.id },
        data: {
          quantity: {
            decrement: deduct,
          },
        },
      });

      await tx.saleItemLot.create({
        data: {
          saleItemId,
          purchaseItemId: lot.id,
          quantity: deduct,
        },
      });

      totalCost += lot.cost.toNumber() * deduct;

      remaining -= deduct;
    }

    if (remaining > 0) {
      throw new Error("Stock insuficiente en lotes");
    }

    return totalCost;
  }

  static async transfer(params: {
    productId: number;
    fromWarehouseId: number;
    toWarehouseId: number;
    quantity: number;
  }) {
    const { productId, fromWarehouseId, toWarehouseId, quantity } = params;

    if (quantity <= 0) {
      throw new Error("Cantidad inválida");
    }

    return prisma.$transaction(async (tx) => {

      let remaining = quantity;

      const lots = await tx.purchaseItem.findMany({
        where: {
          productId,
          warehouseId: fromWarehouseId,
          quantity: { gt: 0 },
        },
        orderBy: [
          { expiresAt: "asc" },
          { purchase: { createdAt: "asc" } },
        ],
      });

      if (!lots.length) {
        throw new Error("No hay stock disponible para transferir");
      }

      for (const lot of lots) {
        if (remaining <= 0) break;

        const deduct = Math.min(lot.quantity, remaining);

        await tx.purchaseItem.update({
          where: { id: lot.id },
          data: {
            quantity: { decrement: deduct },
          },
        });

        await tx.purchaseItem.create({
          data: {
            purchaseId: lot.purchaseId,
            productId,
            warehouseId: toWarehouseId,
            quantity: deduct,
            cost: lot.cost,
            expiresAt: lot.expiresAt,
          },
        });

        remaining -= deduct;
      }

      if (remaining > 0) {
        throw new Error("Stock insuficiente para transferencia");
      }

      await tx.inventoryMovement.createMany({
        data: [
          {
            productId,
            warehouseId: fromWarehouseId,
            type: "OUT",
            quantity: -quantity,
            note: "Transferencia salida",
          },
          {
            productId,
            warehouseId: toWarehouseId,
            type: "IN",
            quantity,
            note: "Transferencia entrada",
          },
        ],
      });
    });
  }

  static async getInventorySummary(params: {
    warehouseId: number;
    search?: string;
  }) {
    const { warehouseId, search } = params;

    const products = await prisma.product.findMany({
      where: { 
        active: true,
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }),
       },
      select: {
        id: true,
        sku: true,
        name: true,
        active: true,
      },
    });

    const stocks = await prisma.purchaseItem.groupBy({
      by: ["productId"],
      where: { warehouseId },
      _sum: { quantity: true },
    });

    const stockMap = new Map(
      stocks.map(s => [s.productId, s._sum.quantity ?? 0])
    );

    return products.map(p => ({
      ...p,
      stock: stockMap.get(p.id) ?? 0,
    }));
  }

  static async createMovementTX(
    tx: Prisma.TransactionClient,
    params: {
      productId: number;
      warehouseId: number;
      type: InventoryMovementType;
      quantity: number;
      note?: string;
    }
  ) {
    const { productId, warehouseId, type, quantity, note } = params;

    if (quantity <= 0) {
      throw new Error("Cantidad inválida");
    }

    const signedQuantity =
      type === "OUT" ? -quantity : quantity;

    return tx.inventoryMovement.create({
      data: {
        productId,
        warehouseId,
        type,
        quantity: signedQuantity,
        note,
      },
    });
  }

  static async getLotsByProduct(
    productId: number,
    warehouseId: number,
  ) {
    return prisma.purchaseItem.findMany({
      where: {
        productId,
        warehouseId,
        quantity: {
          gt: 0,
        },
      },
      select: {
        id: true,
        quantity: true,
        cost: true,
        expiresAt: true,
        purchase: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { purchase: { createdAt: "asc" } },
      ],
    });
  }

  static async getExpiringLots(
    days = 60,
    warehouseId: number,
  ) {
    const limit = dayjs().add(days, "day").toDate();

    const lots = await prisma.purchaseItem.findMany({
      where: {
        expiresAt: {
          not: null,
          lte: limit,
        },
        quantity: {
          gt: 0,
        },
        purchase: {
          warehouseId,
        }
      },
      select: {
        id: true,
        quantity: true,
        expiresAt: true,
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        expiresAt: "asc",
      },
    });

    return lots.map(lot => ({
      productId: lot.product.id,
      productName: lot.product.name,
      quantity: lot.quantity,
      expiresAt: lot.expiresAt,
      daysLeft: dayjs(lot.expiresAt).diff(dayjs(), "day"),
    }));
  }
}