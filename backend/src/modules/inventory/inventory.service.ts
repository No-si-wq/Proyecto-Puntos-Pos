import prisma from "../../core/prisma";
import { InventoryMovementType, PaymentMethod, Prisma, PurchaseStatus } from "@prisma/client";
import dayjs from "dayjs";

export class InventoryService {
  private static readonly NEGATIVE_STOCK_SUPPLIER_NAME = "__SYSTEM_NEGATIVE_STOCK__";

  static async getStock(productId: number, warehouseId: number, tenantId: number) {
    const result = await prisma.purchaseItem.aggregate({
      where: {
        productId,
        warehouseId,
        tenantId,
      },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity ?? 0;
  }

  static async consumeStockFIFO(
    tx: Prisma.TransactionClient,
    tenantId: number,
    saleItemId: number,
    productId: number,
    warehouseId: number,
    quantity: number
  ) {
    if (quantity <= 0) {
      throw new Error("Cantidad inválida");
    }

    let remaining = quantity;
    let totalCost = new Prisma.Decimal(0);

    const lots = await tx.purchaseItem.findMany({
      where: {
        tenantId,
        productId,
        warehouseId,
      },
      orderBy: [
        { purchase: { createdAt: "asc" } },
      ],
    });

    for (const lot of lots) {
      if (remaining <= 0) break;

      if (lot.quantity <= 0) continue;

      const deduct = Math.min(lot.quantity, remaining);

      await tx.purchaseItem.update({
        where: { id: lot.id, tenantId },
        data: {
          quantity: {
            decrement: deduct,
          },
        },
      });

      await tx.saleItemLot.upsert({
        where: {
          saleItemId_purchaseItemId: {
            saleItemId,
            purchaseItemId: lot.id,
          },
        },
        update: {
          quantity: {
            increment: deduct,
          },
        },
        create: {
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

    // Permite sobregirar stock: registra faltante en el lote FIFO más antiguo.
    // Esto hace que el stock agregado pueda quedar negativo.
    if (remaining > 0) {
      const fallbackLot =
        lots[0] ??
        (await InventoryService.createNegativeStockLotTX(tx, {
          tenantId,
          productId,
          warehouseId,
        }));

      if (!fallbackLot) {
        throw new Error("No hay lotes para el producto; no se puede sobregirar stock");
      }

      await tx.purchaseItem.update({
        where: { id: fallbackLot.id, tenantId },
        data: {
          quantity: {
            decrement: remaining,
          },
        },
      });

      await tx.saleItemLot.upsert({
        where: {
          saleItemId_purchaseItemId: {
            saleItemId,
            purchaseItemId: fallbackLot.id,
          },
        },
        update: {
          quantity: {
            increment: remaining,
          },
        },
        create: {
          saleItemId,
          purchaseItemId: fallbackLot.id,
          quantity: remaining,
        },
      });

      totalCost = totalCost.plus(
        new Prisma.Decimal(fallbackLot.cost).mul(remaining)
      );
    }

    return totalCost;
  }

  private static async createNegativeStockLotTX(
    tx: Prisma.TransactionClient,
    params: {
      tenantId: number;
      productId: number;
      warehouseId: number;
    }
  ) {
    const { tenantId, productId, warehouseId } = params;

    const product = await tx.product.findFirst({
      where: { id: productId, tenantId },
      select: { cost: true },
    });

    if (!product) {
      throw new Error("Producto no encontrado para crear lote de stock negativo");
    }

    const supplier = await tx.supplier.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: InventoryService.NEGATIVE_STOCK_SUPPLIER_NAME,
        },
      },
      update: {},
      create: {
        tenantId,
        name: InventoryService.NEGATIVE_STOCK_SUPPLIER_NAME,
        active: true,
      },
      select: { id: true },
    });

    const purchase = await tx.purchase.create({
      data: {
        tenantId,
        total: new Prisma.Decimal(0),
        supplierId: supplier.id,
        warehouseId,
        paymentMethod: PaymentMethod.CASH,
        status: PurchaseStatus.ACTIVE,
        purchaseNumber: `SYSTEM-NEGATIVE-${warehouseId}-${Date.now()}`,
      },
      select: { id: true },
    });

    return tx.purchaseItem.create({
      data: {
        tenantId,
        purchaseId: purchase.id,
        productId,
        warehouseId,
        quantity: 0,
        cost: product.cost,
        lotNumber: "SYSTEM-NEGATIVE",
      },
    });
  }

  static async transfer(params: {
    tenantId: number,
    productId: number;
    fromWarehouseId: number;
    toWarehouseId: number;
    quantity: number;
  }) {
    const { productId, fromWarehouseId, toWarehouseId, quantity, tenantId } = params;
    let totalCost = new Prisma.Decimal(0);

    if (quantity <= 0) {
      throw new Error("Cantidad inválida");
    }

    return prisma.$transaction(async (tx) => {

      let remaining = quantity;

      const lots = await tx.purchaseItem.findMany({
        where: {
          tenantId,
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
            tenantId,
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
        tenantId,
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
        tenantId,
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
    tenantId: number;
    warehouseId: number;
    fromProductId: number;
    toProductId: number;
    quantity: number;
    factor: number;
  }) {
    const { tenantId, warehouseId, fromProductId, toProductId, quantity, factor } = params;

    if (quantity <= 0 || factor <= 0) throw new Error("Cantidad o factor inválido");
    if (fromProductId === toProductId) throw new Error("Los productos deben ser diferentes");

    return prisma.$transaction(async (tx) => {
      let remaining = quantity;
      let totalCost = new Prisma.Decimal(0);

      const lots = await tx.purchaseItem.findMany({
        where: { tenantId, productId: fromProductId, warehouseId, quantity: { gt: 0 } },
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
            tenantId,
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
        tenantId,
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
        tenantId,
        type: InventoryMovementType.IN,
        quantity: quantity * factor,
        movementValue: totalCost,
        referenceType: "TRANSFER_PRODUCT",
        referenceId: fromProductId,
        note: `Transferencia desde producto #${fromProductId}`,
      });
    });
  }

  static async transferWarehouse(params: {
    tenantId: number;
    fromWarehouseId: number;
    toWarehouseId: number;
    items: {
      productId: number;
      quantity: number;
    }[];
  }) {
    const { tenantId, fromWarehouseId, toWarehouseId, items } = params;

    if (fromWarehouseId === toWarehouseId) {
      throw new Error("Las bodegas deben ser diferentes");
    }

    if (!items.length) {
      throw new Error("Debe enviar al menos un producto a transferir");
    }

    return prisma.$transaction(async (tx) => {
      const costByProduct = new Map<number, Prisma.Decimal>();
      const quantityByProduct = new Map<number, number>();

      for (const item of items) {
        let remainingQty = item.quantity;

        const lots = await tx.purchaseItem.findMany({
          where: {
            tenantId,
            warehouseId: fromWarehouseId,
            productId: item.productId,
            quantity: { gt: 0 },
          },
          orderBy: [
            { expiresAt: "asc" },
            { purchase: { createdAt: "asc" } },
          ],
        });

        if (!lots.length) {
          throw new Error(`No hay stock para el producto ${item.productId}`);
        }

        for (const lot of lots) {
          if (remainingQty <= 0) break;

          const moveQty = Math.min(lot.quantity, remainingQty);

          await tx.purchaseItem.update({
            where: { id: lot.id },
            data: { quantity: { decrement: moveQty } },
          });

          const existingLot = await tx.purchaseItem.findFirst({
            where: {
              tenantId,
              productId: lot.productId,
              warehouseId: toWarehouseId,
              cost: lot.cost,
              expiresAt: lot.expiresAt,
              purchaseId: lot.purchaseId,
            },
          });

          if (existingLot) {
            await tx.purchaseItem.update({
              where: { id: existingLot.id },
              data: { quantity: { increment: moveQty } },
            });
          } else {
            await tx.purchaseItem.create({
              data: {
                purchaseId: lot.purchaseId,
                tenantId,
                productId: lot.productId,
                warehouseId: toWarehouseId,
                quantity: moveQty,
                cost: lot.cost,
                expiresAt: lot.expiresAt,
              },
            });
          }

          const lotCost = new Prisma.Decimal(lot.cost).mul(moveQty);

          costByProduct.set(
            lot.productId,
            (costByProduct.get(lot.productId) ?? new Prisma.Decimal(0)).plus(lotCost)
          );

          quantityByProduct.set(
            lot.productId,
            (quantityByProduct.get(lot.productId) ?? 0) + moveQty
          );

          remainingQty -= moveQty;
        }

        if (remainingQty > 0) {
          throw new Error(`Stock insuficiente para producto ${item.productId}`);
        }
      }

      // Registrar movimientos en el ledger
      for (const [productId, totalCost] of costByProduct.entries()) {
        const qty = quantityByProduct.get(productId)!;

        await InventoryService.createMovementTX(tx, {
          productId,
          warehouseId: fromWarehouseId,
          tenantId,
          type: InventoryMovementType.OUT,
          quantity: qty,
          movementValue: totalCost,
          referenceType: "TRANSFER_WAREHOUSE",
          referenceId: 0, // ya no hay transfer.id
          note: `Transferencia salida de bodega ${fromWarehouseId}`,
        });

        await InventoryService.createMovementTX(tx, {
          productId,
          warehouseId: toWarehouseId,
          tenantId,
          type: InventoryMovementType.IN,
          quantity: qty,
          movementValue: totalCost,
          referenceType: "TRANSFER_WAREHOUSE",
          referenceId: 0,
          note: `Transferencia entrada a bodega ${toWarehouseId}`,
        });
      }

      return { productsTransferred: costByProduct.size };
    });
  }

  static async getInventorySummary(params: {
    tenantId: number;
    warehouseId: number;
    search?: string;
  }) {
    const { warehouseId, tenantId, search } = params;

    const products = await prisma.product.findMany({
      where: { 
        active: true,
        tenantId,
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              sku: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              barcodes: {
                some: {
                  code: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              }
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
      where: { warehouseId, tenantId },
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
      tenantId: number;
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
      tenantId,
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
        tenantId,
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
    tenantId: number,
    warehouseId: number,
  ) {
    return prisma.purchaseItem.findMany({
      where: {
        productId,
        tenantId,
        warehouseId,
        quantity: {
          gt: 0,
        },
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
      orderBy: [
        { purchase: { createdAt: "asc" } },
      ],
    });
  };

  static async getAllLots(tenantId: number, warehouseId: number) {
    const lots = await prisma.purchaseItem.findMany({
      where: {
        tenantId,
        warehouseId,
        quantity: { gt: 0 },
      },
      select: {
        id: true,
        quantity: true,
        cost: true,
        lotNumber: true,
        expiresAt: true,
        productId: true,
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

    return lots.reduce<Record<number, typeof lots>>((acc, lot) => {
      if (!acc[lot.productId]) acc[lot.productId] = [];
      acc[lot.productId].push(lot);
      return acc;
    }, {});
  };

  static async getExpiringLots(
    days = 60,
    warehouseId: number,
    tenantId: number,
  ) {
    const limit = dayjs().add(days, "day").toDate();

    const lots = await prisma.purchaseItem.findMany({
      where: {
        warehouseId,
        tenantId,
        expiresAt: {
          not: null,
          lte: limit,
        },
        quantity: {
          gt: 0,
        },
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

  static async adjust(params: {
    tenantId: number;
    productId: number;
    warehouseId: number;
    physicalQuantity: number;  // Lo que el usuario contó en físico
    note: string;
    createdBy: number;         // userId
  }) {
    const { tenantId, productId, warehouseId, physicalQuantity, note, createdBy } = params;

    if (physicalQuantity < 0) throw new Error("La cantidad física no puede ser negativa");

    return prisma.$transaction(async (tx) => {
      // 1. Stock actual en sistema
      const result = await tx.purchaseItem.aggregate({
        where: { tenantId, productId, warehouseId },
        _sum: { quantity: true },
      });
      const currentStock = result._sum.quantity ?? 0;
      const delta = physicalQuantity - currentStock;

      if (delta === 0) return { delta: 0, message: "Sin diferencia" };

      // 2a. Falta stock → crear lote de ajuste
      if (delta > 0) {
        const product = await tx.product.findFirstOrThrow({
          where: { id: productId, tenantId },
          select: { cost: true },
        });

        // Reutiliza el proveedor de sistema (igual que createNegativeStockLotTX)
        const supplier = await tx.supplier.upsert({
          where: { tenantId_name: { tenantId, name: InventoryService.NEGATIVE_STOCK_SUPPLIER_NAME } },
          update: {},
          create: { tenantId, name: InventoryService.NEGATIVE_STOCK_SUPPLIER_NAME, active: true },
          select: { id: true },
        });

        const purchase = await tx.purchase.create({
          data: {
            tenantId,
            total: new Prisma.Decimal(product.cost).mul(delta),
            supplierId: supplier.id,
            warehouseId,
            paymentMethod: PaymentMethod.CASH,
            status: PurchaseStatus.ACTIVE,
            purchaseNumber: `ADJUST-IN-${warehouseId}-${Date.now()}`,
          },
          select: { id: true },
        });

        await tx.purchaseItem.create({
          data: {
            tenantId,
            purchaseId: purchase.id,
            productId,
            warehouseId,
            quantity: delta,
            cost: product.cost,
            lotNumber: "ADJUSTMENT",
          },
        });

        const movementValue = new Prisma.Decimal(product.cost).mul(delta);

        await tx.inventoryLedger.create({
          data: {
            tenantId, productId, warehouseId,
            type: InventoryMovementType.IN,
            quantity: delta,
            movementValue,
            referenceType: "INVENTORY_ADJUSTMENT",
            note,
            createdBy,
          },
        });
      }

      // 2b. Sobra stock → consumir lotes FIFO
      if (delta < 0) {
        const toRemove = Math.abs(delta);
        let remaining = toRemove;

        const lots = await tx.purchaseItem.findMany({
          where: { tenantId, productId, warehouseId },
          orderBy: [{ purchase: { createdAt: "asc" } }],
        });

        for (const lot of lots) {
          if (remaining <= 0) break;
          const deduct = Math.min(lot.quantity, remaining);
          await tx.purchaseItem.update({
            where: { id: lot.id },
            data: { quantity: { decrement: deduct } },
          });
          remaining -= deduct;
        }

        // Si aún queda (stock negativo permitido en tu sistema)
        if (remaining > 0 && lots.length > 0) {
          await tx.purchaseItem.update({
            where: { id: lots[0].id },
            data: { quantity: { decrement: remaining } },
          });
        }

        await tx.inventoryLedger.create({
          data: {
            tenantId, productId, warehouseId,
            type: InventoryMovementType.OUT,
            quantity: toRemove,
            movementValue: new Prisma.Decimal(0),
            referenceType: "INVENTORY_ADJUSTMENT",
            note,
            createdBy,
          },
        });
      }

      return { delta, previousStock: currentStock, newStock: physicalQuantity };
    });
  }

  static async getTransferReport(params: {
    tenantId: number;
    warehouseId?: number;
    productId?: number;
    from?: Date;
    to?: Date;
  }) {
    const { tenantId, warehouseId, productId, from, to } = params;

    // Traer todos los movimientos OUT de transferencia (cada transferencia genera un OUT + un IN)
    // Agrupamos los pares por (referenceId, productId, createdAt aprox.) usando solo los OUT
    const outMovements = await prisma.inventoryLedger.findMany({
      where: {
        tenantId,
        referenceType: "TRANSFER_WAREHOUSE",
        type: InventoryMovementType.OUT,
        ...(warehouseId && { warehouseId }),
        ...(productId && { productId }),
        ...(from || to
          ? {
              createdAt: {
                ...(from && { gte: from }),
                ...(to && { lte: to }),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!outMovements.length) return [];

    // Recolectar IDs únicos para resolver nombres
    const productIds = [...new Set(outMovements.map((m) => m.productId))];
    const warehouseIds = [
      ...new Set([
        ...outMovements.map((m) => m.warehouseId),
        ...outMovements.map((m) => m.referenceId).filter(Boolean) as number[],
      ]),
    ];

    const [products, warehouses] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds }, tenantId },
        select: { id: true, name: true, sku: true },
      }),
      prisma.warehouse.findMany({
        where: { id: { in: warehouseIds } },
        select: { id: true, name: true },
      }),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

    return outMovements.map((m) => ({
      id: m.id.toString(),
      createdAt: m.createdAt,
      product: productMap.get(m.productId) ?? { id: m.productId, name: "—", sku: "—" },
      fromWarehouse: warehouseMap.get(m.warehouseId) ?? { id: m.warehouseId, name: "—" },
      toWarehouse: m.referenceId
        ? (warehouseMap.get(m.referenceId) ?? { id: m.referenceId, name: "—" })
        : null,
      quantity: m.quantity,
      movementValue: m.movementValue,
      note: m.note,
    }));
  }  
}
