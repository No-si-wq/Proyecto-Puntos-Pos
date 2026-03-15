import prisma from "../../core/prisma";
import { Prisma } from "@prisma/client";
import { CommissionType, InventoryMovementType, SaleStatus } from "@prisma/client";
import { InventoryError } from "../inventory/inventory";
import { InventoryService } from "../inventory/inventory.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { CreateSaleInput, SaleError } from "./sale";

export class SaleService {
  static async list(warehouseId: number, params?: { from?: Date; to?: Date }) {
    let dataFilter = {};

    if (params?.from && params?.to) {
      dataFilter = {
        createdAt: { gte: params.from, lte: params.to },
      };
    }

    return prisma.sale.findMany({
      where: { warehouseId, ...dataFilter },
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
        priceList: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: number, warehouseId: number) {
    const sale = await prisma.sale.findFirst({
      where: { id, warehouseId },
      select: {
        id: true,
        saleNumber: true,
        status: true,
        createdAt: true,
        grossSubtotal: true,
        subtotal: true,
        discount: true,
        total: true,
        cogs: true,
        pointsUsed: true,
        pointsEarned: true,
        paymentMethod: true,
        customer: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        priceList: { select: { id: true, name: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            discountType: true,
            discountValue: true,
            discountAmount: true,
            lineSubtotal: true,
            commissionPercent: true,
            commissionAmount: true,
            product: { select: { id: true, name: true, sku: true } },
            lots: { select: { purchaseItemId: true, quantity: true } },
          },
        },
        commissions: {
          select: {
            id: true,
            saleItemId: true,
            percent: true,
            amount: true,
            type: true,
            createdAt: true,
          },
        },
        receivable: { select: { id: true, total: true, balance: true, dueDate: true } },
      },
    });

    if (!sale) throw new Error(SaleError.SALE_NOT_FOUND);
    return sale;
  }

  static async create(
    data: CreateSaleInput,
    userId: number,
    warehouseId: number
  ) {
    return await prisma.$transaction(async (tx) => {
      if (data.items.length === 0) {
        throw new Error(SaleError.EMPTY_SALE);
      }
 
      const priceListIds = [
        ...new Set(
          data.items
            .map((i) => i.priceListId)
            .filter((id): id is number => id !== undefined)
        ),
      ];
 
      if (priceListIds.length > 0) {
        const priceLists = await tx.priceList.findMany({
          where: { id: { in: priceListIds }, active: true },
          select: { id: true },
        });
        const validIds = new Set(priceLists.map((pl) => pl.id));
        for (const id of priceListIds) {
          if (!validIds.has(id)) throw new Error(SaleError.INVALID_PRICE_LIST);
        }
      }
 
      const products = await tx.product.findMany({
        where: { id: { in: data.items.map((i) => i.productId) } },
        include: {
          prices: {
            where:
              priceListIds.length > 0
                ? { priceListId: { in: priceListIds }, active: true }
                : { id: -1 },
          },
        },
      });
 
      const productMap = new Map(products.map((p) => [p.id, p]));
 
      const sellerCommissions = await tx.salesCommission.findMany({
        where: { userId, active: true },
        select: { 
          percent: true,
          level: {
            select: { priceListId: true },
          },
        },
      });

      const commissionByPriceList = new Map<number | null, Prisma.Decimal>();
        for (const sc of sellerCommissions) {
          commissionByPriceList.set(sc.level.priceListId, new Prisma.Decimal(sc.percent));
        }
 
      let grossSubtotal = 0;
      let subtotalAfterLineDiscount = 0;
 
      const calculatedItems: {
        productId: number;
        quantity: number;
        priceListId: number | null;
        price: Prisma.Decimal;
        discountType: any;
        discountValue: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        lineSubtotal: Prisma.Decimal;
        commissionPercent: Prisma.Decimal | null;
        commissionAmount: Prisma.Decimal | null;
      }[] = [];
 
      for (const item of data.items) {
        const product = productMap.get(item.productId);
 
        if (!product || !product.active) {
          throw new Error(SaleError.PRODUCT_NOT_AVAILABLE);
        }
 
        const customPrice = item.priceListId
          ? product.prices?.find((pp) => pp.priceListId === item.priceListId)?.price
          : undefined;
        const price: Prisma.Decimal =
          customPrice !== undefined
            ? new Prisma.Decimal(customPrice)
            : product.price;
 
        const quantity = item.quantity;
        const grossLine = price.mul(quantity);
 
        const discountType = item.discountType ?? "NONE";
        const discountValue = new Prisma.Decimal(item.discountValue ?? 0);
        let discountAmount = new Prisma.Decimal(0);
 
        if (discountType === "PERCENTAGE") {
          if (discountValue.gt(100)) throw new Error("Descuento porcentual inválido");
          discountAmount = grossLine.mul(discountValue).div(100);
        }
 
        if (discountType === "FIXED") {
          if (discountValue.gt(grossLine)) throw new Error("Descuento mayor al subtotal");
          discountAmount = discountValue;
        }
 
        const lineSubtotal = grossLine.sub(discountAmount);
        if (lineSubtotal.lt(0)) throw new Error("Subtotal negativo en línea");

        const commissionPercent: Prisma.Decimal | null =
          commissionByPriceList.get(item.priceListId ?? null) ??
          commissionByPriceList.get(null) ??
          null;
 
        const commissionAmount = commissionPercent
          ? lineSubtotal.mul(commissionPercent).div(100).toDecimalPlaces(2)
          : null;
 
        grossSubtotal += grossLine.toNumber();
        subtotalAfterLineDiscount += lineSubtotal.toNumber();
 
        calculatedItems.push({
          productId: item.productId,
          quantity,
          priceListId: item.priceListId ?? null,
          price,
          discountType,
          discountValue,
          discountAmount,
          lineSubtotal,
          commissionPercent,
          commissionAmount,
        });
      }
 
      const sequence = await tx.saleSequence.upsert({
        where: { warehouseId },
        create: { warehouseId, current: 1 },
        update: { current: { increment: 1 } },
        select: { current: true },
      });
 
      const saleNumber = `SALE-${warehouseId}-${String(sequence.current).padStart(6, "0")}`;
      const subtotalDecimal = new Prisma.Decimal(subtotalAfterLineDiscount);
      const pointsUsed = data.pointsUsed ?? 0;
 
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          grossSubtotal: new Prisma.Decimal(grossSubtotal),
          subtotal: subtotalDecimal,
          discount: new Prisma.Decimal(0),
          total: subtotalDecimal,
          pointsUsed,
          pointsEarned: 0,
          userId,
          customerId: data.customerId,
          warehouseId,
          paymentMethod: data.paymentMethod,
          status: SaleStatus.COMPLETED,
        },
      });
 
      let globalDiscount = new Prisma.Decimal(0);
 
      if (pointsUsed > 0 && data.customerId) {
        const discountFromPoints = await LoyaltyService.usePoints(
          tx,
          data.customerId,
          sale.id,
          pointsUsed
        );
        globalDiscount = new Prisma.Decimal(discountFromPoints);
      }
 
      const total = subtotalDecimal.sub(globalDiscount);
      if (total.lt(0)) throw new Error(SaleError.INVALID_TOTAL);
 
      await tx.sale.update({
        where: { id: sale.id },
        data: { discount: globalDiscount, total },
      });
 
      let totalCogs = new Prisma.Decimal(0);
 
      for (const item of calculatedItems) {
        if (item.quantity <= 0) {
          throw new Error(SaleError.INVALID_QUANTITY);
        }
        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            priceListId: item.priceListId,
            price: item.price,
            discountType: item.discountType,
            discountValue: item.discountValue,
            discountAmount: item.discountAmount,
            lineSubtotal: item.lineSubtotal,
            commissionPercent: item.commissionPercent,
            commissionAmount: item.commissionAmount,
          },
        });
 
        if (item.commissionPercent !== null && item.commissionAmount !== null) {
          await tx.commission.create({
            data: {
              userId,
              saleId: sale.id,
              saleItemId: saleItem.id,
              percent: item.commissionPercent,
              amount: item.commissionAmount,
              type: CommissionType.SALE,
            },
          });
        }
 
        let itemCogs : Prisma.Decimal;
        try {
          itemCogs = await InventoryService.consumeStockFIFO(
            tx,
            saleItem.id,
            item.productId,
            warehouseId,
            item.quantity
          );
        } catch (err: any) {
          if (err.message === InventoryError.INSUFFICIENT_STOCK) {
            throw new Error(SaleError.INSUFFICIENT_STOCK);
          }
          if (err.message === InventoryError.INVALID_ITEM) {
            throw new Error(SaleError.INVALID_ITEM);
          }
          throw err;
        }
 
        totalCogs = totalCogs.add(itemCogs);
 
        await InventoryService.createMovementTX(tx, {
          productId: item.productId,
          warehouseId,
          type: InventoryMovementType.OUT,
          quantity: item.quantity,
          movementValue: itemCogs,
          referenceType: "SALE",
          referenceId: sale.id,
          note: `Venta ${sale.saleNumber}`,
        });
      }
 
      if (data.paymentMethod === "CREDIT") {
        if (!sale.customerId) throw new Error("Venta a crédito requiere cliente");
        await tx.accountReceivable.create({
          data: {
            saleId: sale.id,
            customerId: sale.customerId,
            total,
            balance: total,
            dueDate: data.dueDate ?? null,
          },
        });
      }
 
      let pointsEarned = 0;
      if (data.customerId) {
        pointsEarned = await LoyaltyService.earnPoints(
          tx,
          data.customerId,
          total.toNumber(),
          sale.id
        );
      }
 
      await tx.sale.update({
        where: { id: sale.id },
        data: { pointsEarned, cogs: totalCogs },
      });
 
      const totalCommission = calculatedItems.reduce(
        (acc, i) => acc.add(i.commissionAmount ?? 0),
        new Prisma.Decimal(0)
      );
 
      return {
        ...sale,
        grossSubtotal,
        subtotal: subtotalDecimal,
        discount: globalDiscount,
        total,
        pointsEarned,
        cogs: totalCogs,
        grossProfit: total.sub(totalCogs),
        totalCommission,
      };
    });
  }

  static async cancel(id: number) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: {
          items: { include: { lots: true } },
        },
      });

      if (!sale || sale.status === SaleStatus.CANCELLED) {
        throw new Error(SaleError.SALE_NOT_FOUND);
      }

      for (const item of sale.items) {
        for (const allocation of item.lots) {
          if (allocation.quantity <= 0) {
            throw new Error(SaleError.INVALID_QUANTITY);
          }

          const updated = await tx.purchaseItem.updateMany({
            where: { id: allocation.purchaseItemId },
            data: { quantity: { increment: allocation.quantity } },
          });
          if (updated.count === 0) throw new Error("Error restaurando lote FIFO");
        }
      }

      const originalMovements = await tx.inventoryLedger.findMany({
        where: {
          referenceType: "SALE",
          referenceId: sale.id,
          type: InventoryMovementType.OUT,
        },
      });

      for (const movement of originalMovements) {
        await InventoryService.createMovementTX(tx, {
          productId: movement.productId,
          warehouseId: movement.warehouseId,
          type: InventoryMovementType.IN,
          quantity: movement.quantity,
          movementValue: movement.movementValue,
          referenceType: "SALE_CANCEL",
          referenceId: sale.id,
          note: `Cancelación venta ${sale.saleNumber}`,
        });
      }

      await tx.saleItemLot.deleteMany({
        where: { saleItemId: { in: sale.items.map((i) => i.id) } },
      });

      if (sale.customerId) {
        await LoyaltyService.rollbackPoints(tx, sale.customerId, sale.id);
      }

      const originalCommissions = await tx.commission.findMany({
        where: { saleId: sale.id, type: CommissionType.SALE },
      });

      for (const commission of originalCommissions) {
        await tx.commission.create({
          data: {
            userId: commission.userId,
            saleId: commission.saleId,
            saleItemId: commission.saleItemId,
            percent: commission.percent,
            amount: commission.amount.neg(),
            type: CommissionType.REVERSAL,
          },
        });
      }

      return tx.sale.update({
        where: { id },
        data: { status: SaleStatus.CANCELLED },
      });
    });
  }
}