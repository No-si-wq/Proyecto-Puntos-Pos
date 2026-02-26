import prisma from "../config/prisma";
import { InventoryMovementType } from "@prisma/client";
import { InventoryService } from "./inventory.service";
import { InventoryError } from "../types/inventory";
import { CreatePurchaseInput, PurchaseError } from "../types/purchase";

export class PurchaseService {
  static async list(
    warehouseId: number,
    params?: {from?: Date; to?: Date } 
  ) {
    let dataFilter = {}

    if (params?.from && params?.to) {
      dataFilter = {
        createdAt: {
          gte: params.from,
          lte: params.to,
        },
      };
    }

    const purchases = await prisma.purchase.findMany({
      where: {
        warehouseId,
        ...dataFilter,
      },
      select: {
        id: true,
        total: true,
        createdAt: true,
        supplier: {
          select: { id: true, name: true, }
        },
        user: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return purchases.map((p) => ({
      id: p.id,
      total: p.total,
      createdAt: p.createdAt,
      supplier: p.supplier,
      user: p.user,
      itemsCount: p._count.items,
    }));
  }

  static async listLotsByProduct(productId: number) {
    return prisma.purchaseItem.findMany({
      where: {
        productId,
        quantity: { gt: 0 },
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
      orderBy: { expiresAt: "asc" },
    });
  }

  static async create(
    data: CreatePurchaseInput,
    userId: number,
    warehouseId: number,
  ) {
    return prisma.$transaction(async (tx) => {

      const supplier = await tx.supplier.findUnique({
        where: { id: data.supplierId },
      });

      if (!supplier || !supplier.active) {
        throw new Error(PurchaseError.INVALID_ITEM);
      }

      let total = 0;

      for (const item of data.items) {
        if (item.quantity <= 0 || item.cost < 0) {
          throw new Error(InventoryError.INVALID_ITEM);
        }
        total += item.quantity * item.cost;
      }

      const purchase = await tx.purchase.create({
        data: {
          supplierId: data.supplierId,
          total,
          warehouseId,
          userId,
          paymentMethod: data.paymentMethod,
        },
      });

      for (const item of data.items) {
        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: item.productId,
            warehouseId,
            quantity: item.quantity,
            cost: item.cost,
            expiresAt: item.expiresAt ?? null,
          },
        });

        await InventoryService.createMovementTX(tx, {
            productId: item.productId,
            warehouseId,
            type: InventoryMovementType.IN,
            quantity: item.quantity,
            note: `Compra #${purchase.id}`
          }
        );
      }

    if (data.paymentMethod === "CREDIT") {
      await tx.accountPayable.create({
        data: {
          purchaseId: purchase.id,
          supplierId: purchase.supplierId,
          total: purchase.total,
          balance: purchase.total,
          dueDate: data.dueDate ?? null,
        },
      });
    }

      return purchase;
    });
  }
}