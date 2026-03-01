import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import { InventoryMovementType, SaleStatus } from "@prisma/client";
import { InventoryService } from "./inventory.service";
import { LoyaltyService } from "../modules/loyalty/loyalty.service";
import { CreateSaleInput, SaleError } from "../types/sale";

export class SaleService {
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

    return prisma.sale.findMany({
      where: {
        warehouseId,
        ...dataFilter,
      },
      select: {
        id: true,
        saleNumber: true,
        subtotal: true,
        discount: true,
        total: true,
        pointsUsed: true,
        pointsEarned: true,
        status: true,
        createdAt: true,
        customer: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: number) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });
  }

  static async create(
    data: CreateSaleInput,
    userId: number,
    warehouseId: number,
  ) {
    return prisma.$transaction(async (tx) => {
      if (data.items.length === 0) {
        throw new Error(SaleError.EMPTY_SALE);
      }

      let grossSubtotal = 0;
      let subtotalAfterLineDiscount = 0;

      const products = await tx.product.findMany({
        where: {
          id: { in: data.items.map(i => i.productId) },
        },
      });

      const productMap = new Map(
        products.map(p => [p.id, p])
      );

      const calculatedItems: {
        productId: number;
        quantity: number;
        price: Prisma.Decimal;
        discountType: any;
        discountValue: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        lineSubtotal: Prisma.Decimal;
      }[] = [];

      for (const item of data.items) {
        const product = productMap.get(item.productId);

        if (!product || !product.active) {
          throw new Error(SaleError.PRODUCT_NOT_AVAILABLE);
        }

        const price = product.price;
        const quantity = item.quantity;

        const grossLine = price.mul(quantity);

        const discountType = item.discountType ?? "NONE";
        const discountValue = new Prisma.Decimal(
          item.discountValue ?? 0
        );

        let discountAmount = new Prisma.Decimal(0);

        if (discountType === "PERCENTAGE") {
          if (discountValue.gt(100)) {
            throw new Error("Descuento porcentual inválido");
          }

          discountAmount = grossLine.mul(discountValue).div(100);
        }

        if (discountType === "FIXED") {
          if (discountValue.gt(grossLine)) {
            throw new Error("Descuento mayor al subtotal");
          }

          discountAmount = discountValue;
        }

        const lineSubtotal = grossLine.sub(discountAmount);

        if (lineSubtotal.lt(0)) {
          throw new Error("Subtotal negativo en línea");
        }

        grossSubtotal = grossSubtotal + grossLine.toNumber();
        subtotalAfterLineDiscount =
          subtotalAfterLineDiscount + lineSubtotal.toNumber();

        calculatedItems.push({
          productId: item.productId,
          quantity,
          price,
          discountType,
          discountValue,
          discountAmount,
          lineSubtotal,
        });
      }

      const pointsUsed = data.pointsUsed ?? 0;
      let globalDiscount = new Prisma.Decimal(0);

      if (pointsUsed > 0 && data.customerId) {
        const discountFromPoints =
          await LoyaltyService.usePoints(
            tx,
            data.customerId,
            pointsUsed
          );

        globalDiscount = new Prisma.Decimal(discountFromPoints);
      }

      const subtotalDecimal = new Prisma.Decimal(
        subtotalAfterLineDiscount
      );

      const total = subtotalDecimal.sub(globalDiscount);

      if (total.lt(0)) {
        throw new Error(SaleError.INVALID_TOTAL);
      }

      const sequence = await tx.saleSequence.upsert({
        where: { warehouseId },
        create: {
          warehouseId,
          current: 1,
        },
        update: {
          current: { increment: 1 },
        },
        select: { current: true },
      });

      const saleNumber = `SALE-${warehouseId}-${String(
        sequence.current
      ).padStart(6, "0")}`;

      const sale = await tx.sale.create({
        data: {
          saleNumber,
          grossSubtotal: new Prisma.Decimal(grossSubtotal),
          subtotal: subtotalDecimal,
          discount: globalDiscount,
          total,
          pointsUsed,
          pointsEarned: 0,
          userId,
          customerId: data.customerId,
          warehouseId,
          paymentMethod: data.paymentMethod,
          status: SaleStatus.COMPLETED,
        },
      });

      let totalCogs = new Prisma.Decimal(0);

      for (const item of calculatedItems) {
        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discountType: item.discountType,
            discountValue: item.discountValue,
            discountAmount: item.discountAmount,
            lineSubtotal: item.lineSubtotal,
          },
        });

        const itemCogs =
          await InventoryService.consumeStockFIFO(
            tx,
            saleItem.id,
            item.productId,
            warehouseId,
            item.quantity,
          );

        totalCogs = totalCogs.add(itemCogs);

        await InventoryService.createMovementTX(tx, {
          productId: item.productId,
          warehouseId,
          type: InventoryMovementType.OUT,
          quantity: item.quantity,
          note: `Venta ${sale.saleNumber}`,
        });
      }

      if (data.paymentMethod === "CREDIT") {
        if (!sale.customerId)
          throw new Error(
            "Venta a crédito requiere cliente"
          );

        await tx.accountReceivable.create({
          data: {
            saleId: sale.id,
            customerId: sale.customerId,
            total: total,
            balance: total,
            dueDate: data.dueDate ?? null,
          },
        });
      }

      let pointsEarned = 0;

      if (data.customerId) {
        pointsEarned =
          await LoyaltyService.earnPoints(
            tx,
            data.customerId,
            total.toNumber(),
            sale.id
          );
      }

      await tx.sale.update({
        where: { id: sale.id },
        data: {
          pointsEarned,
          cogs: totalCogs,
        },
      });

      return {
        ...sale,
        grossSubtotal,
        subtotal: subtotalDecimal,
        discount: globalDiscount,
        total,
        pointsEarned,
        cogs: totalCogs,
        grossProfit: total.sub(totalCogs),
      };
    });
  }

  static async cancel(id: number) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { 
          items: {
            include: {
              lots: true,
            },
          }, 
        },
      });

      if (!sale || sale.status === SaleStatus.CANCELLED) {
        throw new Error(SaleError.SALE_NOT_FOUND);
      }

      for (const item of sale.items) {

        for (const allocation of item.lots) {
          await tx.purchaseItem.update({
            where: { id: allocation.purchaseItemId },
            data: {
              quantity: {
                increment: allocation.quantity,
              },
            },
          });
        }

        await tx.saleItemLot.deleteMany({
          where: { saleItemId: item.id }
        });

        await InventoryService.createMovementTX(tx, {
          productId: item.productId,
          warehouseId: sale.warehouseId,
          type: InventoryMovementType.IN,
          quantity: item.quantity,
          note: `Cancelación venta ${sale.saleNumber}`,
        });
      }

      if (sale.customerId) {
        await LoyaltyService.rollbackPoints(tx, sale.customerId, sale.id);
      }

      return tx.sale.update({
        where: { id },
        data: {
          status: SaleStatus.CANCELLED,
          pointsEarned: 0,
        },
      });
    });
  }
}