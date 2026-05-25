import prisma from "../../core/prisma";
import { InventoryMovementType, Prisma } from "@prisma/client";
import { InventoryService } from "../inventory/inventory.service";
import { InventoryError } from "../inventory/inventory";
import { CreatePurchaseInput, PurchaseError } from "./purchase";

export class PurchaseService {
  static async list(
    tenantId: number,
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
        tenantId,
        warehouseId,
        ...dataFilter,
      },
      select: {
        id: true,
        total: true,
        createdAt: true,
        status: true,
        purchaseNumber: true,
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
      ...p,
      itemsCount: p._count.items,
    }));
  }

  static async listLotsByProduct(productId: number, tenantId: number) {
    return prisma.purchaseItem.findMany({
      where: {
        tenantId,
        productId,
        quantity: { gt: 0 },
      },
      select: {
        id: true,
        quantity: true,
        cost: true,
        lotNumber: true,
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

  static async getById(id: number, warehouseId: number, tenantId: number) {
    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        warehouseId,
        tenantId,
      },
      select: {
        id: true,
        total: true,
        createdAt: true,
        status: true,
        paymentMethod: true,
        purchaseNumber: true,

        supplier: {
          select: {
            id: true,
            name: true,
          },
        },

        user: {
          select: {
            id: true,
            name: true,
          },
        },

        items: {
          select: {
            id: true,
            quantity: true,
            cost: true,
            expiresAt: true,
            lotNumber: true,

            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },

        payable: {
          select: {
            id: true,
            total: true,
            balance: true,
            dueDate: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new Error(PurchaseError.PURCHASE_NOT_FOUND);
    }

    return purchase;
  }

  static async create(
    data: CreatePurchaseInput,
    tenantId: number,
    userId: number,
    warehouseId: number,
  ) {
    return prisma.$transaction(async (tx) => {

      const supplier = await tx.supplier.findUnique({
        where: { id: data.supplierId, tenantId },
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
          purchaseNumber: data.purchaseNumber,
          total,
          tenantId,
          warehouseId,
          userId,
          paymentMethod: data.paymentMethod,
        },
      });

      for (const item of data.items) {
        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            tenantId,
            productId: item.productId,
            warehouseId,    
            quantity: item.quantity,       
            cost: item.cost,
            lotNumber: item.lotNumber,            
            expiresAt: item.expiresAt ?? null,
          },
        });

        await InventoryService.createMovementTX(tx, {
          productId: item.productId,
          warehouseId,
          tenantId,
          type: InventoryMovementType.IN,
          quantity: item.quantity,
          movementValue: new Prisma.Decimal(item.quantity).mul(item.cost),
          referenceType: "PURCHASE",
          referenceId: purchase.id,
          note: `Compra #${purchase.purchaseNumber}`,
        });
      }

    if (data.paymentMethod === "CREDIT") {
      await tx.accountPayable.create({
        data: {
          purchaseId: purchase.id,
          tenantId,
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

  static async cancel(
    id: number,
    warehouseId: number,
    tenantId: number,
  ) {
    return prisma.$transaction(async (tx) => {

      const purchase = await tx.purchase.findFirst({
        where: { id, warehouseId, tenantId },
        include: {
          items: {
            include: {
              saleItems: true,
            },
          },
          payable: {
            include: {
              payments: true,
            },
          },
        },
      });

      if (!purchase) {
        throw new Error(PurchaseError.PURCHASE_NOT_FOUND);
      }

      if (purchase.status === "CANCELLED") {
        throw new Error(PurchaseError.PURCHASE_ALREADY_CANCELLED);
      }

      const hasLinkedSales = purchase.items.some(
        (item) => item.saleItems.length > 0
      );
      if (hasLinkedSales) {
        throw new Error(PurchaseError.PURCHASE_HAS_LINKED_SALES);
      }

      if (purchase.payable) {
        const hasPayments = purchase.payable.payments.length > 0;
        if (hasPayments) {
          throw new Error(PurchaseError.PURCHASE_HAS_PAYMENTS);
        }

        await tx.accountPayable.delete({
          where: { id: purchase.payable.id },
        });
      }

      for (const item of purchase.items) {
        await tx.purchaseItem.update({
          where: { id: item.id },
          data: { quantity: 0 },
        });

        await InventoryService.createMovementTX(tx, {
          productId: item.productId,
          warehouseId,
          tenantId,
          type: InventoryMovementType.OUT,
          quantity: item.quantity,
          movementValue: new Prisma.Decimal(item.quantity).mul(item.cost),
          referenceType: "PURCHASE_CANCEL",
          referenceId: purchase.id,
          note: `Cancelación compra #${purchase.purchaseNumber}`,
        });
      }

      return tx.purchase.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    });
  }
}