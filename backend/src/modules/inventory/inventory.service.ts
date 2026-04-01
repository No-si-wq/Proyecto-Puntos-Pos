import prisma from "../../core/prisma";
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
    let totalCost = new Prisma.Decimal(0);

    const lots = await tx.purchaseItem.findMany({
      where: {
        productId,
        warehouseId,
        quantity: { gt: 0 },
      },
      orderBy: [
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

      totalCost = totalCost.plus(
        new Prisma.Decimal(lot.cost).mul(deduct)
      );

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
    let totalCost = new Prisma.Decimal(0);

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

        totalCost = totalCost.plus(
          new Prisma.Decimal(lot.cost).mul(deduct)
        );

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

      await InventoryService.createMovementTX(tx, {
        productId,
        warehouseId: fromWarehouseId,
        type: InventoryMovementType.OUT,
        quantity,
        movementValue: totalCost,
        referenceType: "TRANSFER_WAREHOUSE",
        referenceId: fromWarehouseId,
        note: `Transferencia a bodega #${toWarehouseId}`,
      });

      await InventoryService.createMovementTX(tx, {
        productId,
        warehouseId: toWarehouseId,
        type: InventoryMovementType.IN,
        quantity,
        movementValue: totalCost,
        referenceType: "TRANSFER_WAREHOUSE",
        referenceId: fromWarehouseId,
        note: `Transferencia desde bodega #${fromWarehouseId}`,
      });
    });
  }

  static async transferProduct(params: {
    warehouseId: number;
    fromProductId: number;
    toProductId: number;
    quantity: number;
    factor: number;
  }) {
    const { warehouseId, fromProductId, toProductId, quantity, factor } = params;

    if (quantity <= 0 || factor <= 0) throw new Error("Cantidad o factor inválido");
    if (fromProductId === toProductId) throw new Error("Los productos deben ser diferentes");

    return prisma.$transaction(async (tx) => {
      let remaining = quantity;
      let totalCost = new Prisma.Decimal(0);

      const lots = await tx.purchaseItem.findMany({
        where: { productId: fromProductId, warehouseId, quantity: { gt: 0 } },
        orderBy: [{ expiresAt: "asc" }],
      });

      if (!lots.length) throw new Error("No hay stock disponible");

      for (const lot of lots) {
        if (remaining <= 0) break;
        const deduct = Math.min(lot.quantity, remaining);

        await tx.purchaseItem.update({
          where: { id: lot.id },
          data: { quantity: { decrement: deduct } },
        });

        await tx.purchaseItem.create({
          data: {
            purchaseId: lot.purchaseId,
            productId: toProductId,
            warehouseId,
            quantity: deduct * factor,
            cost: new Prisma.Decimal(lot.cost).div(factor),
            expiresAt: lot.expiresAt,
          },
        });

        totalCost = totalCost.add(new Prisma.Decimal(lot.cost).mul(deduct));
        remaining -= deduct;
      }

      if (remaining > 0) throw new Error("Stock insuficiente");

      await InventoryService.createMovementTX(tx, {
        productId: fromProductId,
        warehouseId,
        type: InventoryMovementType.OUT,
        quantity,
        movementValue: totalCost,
        referenceType: "TRANSFER_PRODUCT",
        referenceId: fromProductId,
        note: `Transferencia a producto #${toProductId}`,
      });

      await InventoryService.createMovementTX(tx, {
        productId: toProductId,
        warehouseId,
        type: InventoryMovementType.IN,
        quantity: quantity * factor,
        movementValue: totalCost,
        referenceType: "TRANSFER_PRODUCT",
        referenceId: fromProductId,
        note: `Transferencia desde producto #${fromProductId}`,
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
              sku: {
                contains: search,
                mode: "insensitive",
              },
            },
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
      movementValue: Prisma.Decimal;
      referenceType?: string;
      referenceId?: number;
      note?: string;
    }
  ) {
    const {
      productId,
      warehouseId,
      type,
      quantity,
      movementValue,
      referenceType,
      referenceId,
      note,
    } = params;

    if (quantity <= 0) {
      throw new Error("Cantidad inválida");
    }

    if (movementValue.lt(0)) {
      throw new Error("Valor de movimiento inválido");
    }

    return tx.inventoryLedger.create({
      data: {
        productId,
        warehouseId,
        type,
        quantity,              
        movementValue,         
        referenceType,
        referenceId,
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