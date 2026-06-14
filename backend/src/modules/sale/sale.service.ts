import prisma from "../../core/prisma";
import { Prisma } from "@prisma/client";
import { CommissionType, InventoryMovementType, SaleStatus } from "@prisma/client";
import { InventoryService } from "../inventory/inventory.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { CreateSaleInput, SaleError, ReturnSaleInput } from "./sale";

export class SaleService {
  static async list(warehouseId: number, tenantId: number, params?: { from?: Date; to?: Date }) {
    let dataFilter = {};

    if (params?.from && params?.to) {
      dataFilter = {
        createdAt: { gte: params.from, lte: params.to },
      };
    }

    return prisma.sale.findMany({
      where: { warehouseId, tenantId, ...dataFilter },
      include: {
        customer: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        priceList: { select: { id: true, name: true, active: true } },
        items: { select: { discountAmount: true } }
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: number, warehouseId: number, tenantId:number) {
    const sale = await prisma.sale.findFirst({
      where: { id, warehouseId, tenantId },
      include: {
        customer: { select: { id: true, name: true, direction: true, dni: true, phone: true } },
        user: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        priceList: { select: { id: true, name: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            tax: true,
            taxAmount: true,
            discountType: true,
            discountValue: true,
            discountAmount: true,
            lineSubtotal: true,
            lineTotal: true,
            commissionPercent: true,
            commissionAmount: true,
            observations: true,
            product: { select: { id: true, name: true, sku: true } },
            lots: { select: { purchaseItemId: true, quantity: true } },
            returnItems: { select: { quantity: true, refundAmount: true } },
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
        payments: {
          select: {
            id: true,
            method: true,
            amount: true,
            reference: true,
          },
        },
        returns: {
          select: {
            id: true,
            reason: true,
            createdAt: true,
            items: { select: { refundAmount: true } },
          },
        },
        receivable: { select: { id: true, total: true, balance: true, dueDate: true } },
      },
    });

    if (!sale) throw new Error(SaleError.SALE_NOT_FOUND);

    const saleWithEffectiveQty = {
      ...sale,
      items: sale.items.map((item) => {
        const returned = item.returnItems.reduce((s, r) => s + r.quantity, 0);
        const refunded = item.returnItems.reduce(
          (s, r) => s.add(new Prisma.Decimal(r.refundAmount)), 
          new Prisma.Decimal(0)
        );
        return {
          ...item,
          quantity: item.quantity - returned,
          returnedQuantity: returned,
          refundedAmount: refunded,         
        };
      }),
      totalRefunded: sale.returns.reduce(   
        (s, r) => s.add(
          r.items.reduce(
            (s2, i) => s2.add(new Prisma.Decimal(i.refundAmount)),
            new Prisma.Decimal(0)
          )
        ),
        new Prisma.Decimal(0)
      ),
    };

    return saleWithEffectiveQty;
  }

  static async create(
    data: CreateSaleInput,
    userId: number,
    warehouseId: number,
    tenantId: number,
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
      
      const commissionUserId = data.sellerId ?? userId;

      const sellerCommissions = await tx.salesCommission.findMany({
        where: { userId: commissionUserId, active: true },
        select: {
          percent: true,
          level: { select: { priceListId: true } },
        },
      });

      const resolveCommissionPercent = (priceListId: number | null | undefined): Prisma.Decimal | null => {
        if (!sellerCommissions.length) return null;

        if (priceListId) {
          const match = sellerCommissions.find((c) => c.level.priceListId === priceListId);
          if (match) return new Prisma.Decimal(match.percent);
        }

        const general = sellerCommissions.find((c) => c.level.priceListId === null);
        return general ? new Prisma.Decimal(general.percent) : null;
      };
 
      let grossSubtotal = 0;
      let subtotalAfterLineDiscount = 0;
      let totalTax = 0;
 
      const calculatedItems: {
        productId: number;
        quantity: number;
        priceListId: number | null;
        price: Prisma.Decimal;
        tax: Prisma.Decimal;
        discountType: any;
        discountValue: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        lineSubtotal: Prisma.Decimal;
        commissionPercent: Prisma.Decimal | null;
        commissionAmount: Prisma.Decimal | null;
        taxAmount: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
        observations: string | null;
      }[] = [];
 
      for (const item of data.items) {
        const product = productMap.get(item.productId);

        if (!product || !product.active) {
          throw new Error(SaleError.PRODUCT_NOT_AVAILABLE);
        }

        let price: Prisma.Decimal;

        if (item.unitPrice !== undefined) {
          if (item.unitPrice <= 0) {
            throw new Error("Precio inválido");
          }
          price = new Prisma.Decimal(item.unitPrice);
        } else {
          const customPrice = item.priceListId
            ? product.prices?.find((pp) => pp.priceListId === item.priceListId)?.price
            : undefined;
          price = customPrice !== undefined
            ? new Prisma.Decimal(customPrice)
            : product.price;
        }

        const tax = product.tax;
 
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
 
        const grossAfterDiscount = grossLine.sub(discountAmount);
        if (grossAfterDiscount.lt(0)) throw new Error("Subtotal negativo en línea");

        let lineSubtotal: Prisma.Decimal; // siempre = base sin impuesto
        let taxAmount: Prisma.Decimal;
        let lineTotal: Prisma.Decimal;

        if (!data.priceMode || data.priceMode === "TAX_INCLUDED") {
          const divisor = new Prisma.Decimal(1).add(tax);
          lineSubtotal = grossAfterDiscount.div(divisor).toDecimalPlaces(6);
          taxAmount    = grossAfterDiscount.sub(lineSubtotal).toDecimalPlaces(6);
          lineTotal    = grossAfterDiscount; // cliente paga precio con tax ya incluido
        } else {
          lineSubtotal = grossAfterDiscount;
          taxAmount    = lineSubtotal.mul(tax).toDecimalPlaces(6);
          lineTotal    = lineSubtotal.add(taxAmount);
        }
 
        const commissionPercent = resolveCommissionPercent(item.priceListId);
        const commissionAmount = commissionPercent
          ? lineSubtotal.mul(commissionPercent).div(100).toDecimalPlaces(2)
          : null;
 
        grossSubtotal += grossLine.toNumber();
        subtotalAfterLineDiscount += lineSubtotal.toNumber();
        totalTax += taxAmount.toNumber();
 
        calculatedItems.push({
          productId: item.productId,
          quantity,
          priceListId: item.priceListId ?? null,
          price,
          tax,
          discountType,
          discountValue,
          discountAmount,
          lineSubtotal,
          commissionPercent,
          commissionAmount,
          taxAmount,
          lineTotal,
          observations: item.observations ?? null,
        });
      }
 
      const sequence = await tx.saleSequence.upsert({
        where: { warehouseId, tenantId },
        create: { warehouseId, tenantId, current: 1 },
        update: { current: { increment: 1 } },
        select: { current: true },
      });
 
      const saleNumber = `SALE-${warehouseId}-${String(sequence.current).padStart(6, "0")}`;
      const subtotalDecimal = new Prisma.Decimal(subtotalAfterLineDiscount);
      const taxTotalDecimal = new Prisma.Decimal(totalTax);
      const pointsUsed = data.pointsUsed ?? 0;

      const hasCredit = data.payments.some(p => p.method === "CREDIT");
      const dominantMethod = hasCredit
        ? "CREDIT"
        : data.payments.reduce((a, b) => (b.amount > a.amount ? b : a)).method;
 
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          grossSubtotal: new Prisma.Decimal(grossSubtotal),
          subtotal: subtotalDecimal,
          discount: new Prisma.Decimal(0),
          taxTotal: taxTotalDecimal,
          total: subtotalDecimal.add(taxTotalDecimal),
          pointsUsed,
          pointsEarned: 0,
          userId,
          sellerId: data.sellerId ?? null,
          customerId: data.customerId,
          warehouseId,
          tenantId,
          paymentMethod: dominantMethod,
          observations: data.observations,
          priceMode: data.priceMode ?? "TAX_INCLUDED",
          status: SaleStatus.COMPLETED,
        },
      });

      await tx.salePayment.createMany({
        data: data.payments.map(p => ({
          saleId: sale.id,
          method: p.method,
          amount: new Prisma.Decimal(p.amount),
          reference: p.reference ?? null,
          tenantId,
        })),
      });
 
      let globalDiscount = new Prisma.Decimal(0);
 
      if (pointsUsed > 0 && data.customerId) {
        const discountFromPoints = await LoyaltyService.usePoints(
          tx,
          tenantId,
          data.customerId,
          sale.id,
          pointsUsed
        );
        globalDiscount = new Prisma.Decimal(discountFromPoints);
      }
      
      if (globalDiscount.gt(0) && subtotalDecimal.gt(0)) {
        const keepRatio = new Prisma.Decimal(1).sub(
          globalDiscount.div(subtotalDecimal)
        );
        for (const item of calculatedItems) {
          if (item.commissionAmount !== null) {
            item.commissionAmount = item.commissionAmount
              .mul(keepRatio)
              .toDecimalPlaces(2);
          }
        }
      }

      const total = subtotalDecimal.sub(globalDiscount).add(taxTotalDecimal);

      if (total.lt(0)) throw new Error(SaleError.INVALID_TOTAL);

      const creditAmount = data.payments
        .filter((p) => p.method === "CREDIT")
        .reduce((acc, p) => acc.add(new Prisma.Decimal(p.amount)), new Prisma.Decimal(0));

      const nonCreditPaid = data.payments
        .filter((p) => p.method !== "CREDIT")
        .reduce((acc, p) => acc.add(new Prisma.Decimal(p.amount)), new Prisma.Decimal(0));

      const totalPaid = nonCreditPaid.add(creditAmount);

      if (totalPaid.lt(total)) {
        throw new Error("El monto pagado es insuficiente");
      }

      const amountPaid = nonCreditPaid;
      const changeAmount = hasCredit
        ? new Prisma.Decimal(0)
        : totalPaid.sub(total);
 
      await tx.sale.update({
        where: { id: sale.id },
        data: { discount: globalDiscount, total },
      });
 
      let totalCogs = new Prisma.Decimal(0);

      const saleItems = await Promise.all(
        calculatedItems.map((item) =>
          tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              priceListId: item.priceListId,
              price: item.price,
              tax: item.tax,
              taxAmount: item.taxAmount,
              lineTotal: item.lineTotal,
              discountType: item.discountType,
              discountValue: item.discountValue,
              discountAmount: item.discountAmount,
              lineSubtotal: item.lineSubtotal,
              commissionPercent: item.commissionPercent,
              commissionAmount: item.commissionAmount,
              observations: item.observations,
            },
          })
        )
      );

      const commissionsData: Prisma.CommissionCreateManyInput[] = calculatedItems.flatMap(
        (item, i) =>
          item.commissionPercent !== null && item.commissionAmount !== null
            ? [{
                userId: commissionUserId,
                saleId: sale.id,
                saleItemId: saleItems[i].id,
                percent: item.commissionPercent,
                amount: item.commissionAmount,
                type: CommissionType.SALE,
                tenantId,
              }]
            : []
      );

      if (commissionsData.length > 0) {
        await tx.commission.createMany({ data: commissionsData });
      }

      for (let i = 0; i < calculatedItems.length; i++) {
        const item = calculatedItems[i];
        const saleItem = saleItems[i];

        const itemCogs = await InventoryService.consumeStockFIFO(
          tx, tenantId, saleItem.id, item.productId, warehouseId, item.quantity
        );

        totalCogs = totalCogs.add(itemCogs);

        await InventoryService.createMovementTX(tx, {
          tenantId,
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
 
      if (hasCredit) {
        if (!sale.customerId) throw new Error("Venta a crédito requiere cliente");

        const customer = await tx.customer.findUnique({
          where: { id: sale.customerId },
          select: { creditLimit: true },
        });

        if (customer?.creditLimit != null) {
          const usedAgg = await tx.accountReceivable.aggregate({
            where: {
              customerId: sale.customerId,
              tenantId,
              status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
            },
            _sum: { balance: true },
          });
          const usedCredit = new Prisma.Decimal(usedAgg._sum.balance ?? 0);
          if (usedCredit.add(creditAmount).gt(customer.creditLimit)) {
            throw new Error(SaleError.CREDIT_LIMIT_EXCEEDED);
          }
        }

        await tx.accountReceivable.create({
          data: {
            saleId: sale.id,
            customerId: sale.customerId,
            total: creditAmount,
            balance: creditAmount,
            dueDate: data.dueDate ?? null,
            tenantId,
          },
        });
      }
 
      let pointsEarned = 0;
      if (data.customerId) {
        pointsEarned = await LoyaltyService.earnPoints(
          tx,
          tenantId,
          data.customerId,
          total.toNumber(),
          sale.id
        );
      }
 
      await tx.sale.update({
        where: { id: sale.id },
        data: { pointsEarned, cogs: totalCogs, amountPaid, changeAmount },
      });
 
      const totalCommission = calculatedItems.reduce(
        (acc, i) => acc.add(i.commissionAmount ?? 0),
        new Prisma.Decimal(0)
      );
 
      return {
        ...sale,
        grossSubtotal,
        subtotal: subtotalDecimal,
        taxTotal: taxTotalDecimal,
        discount: globalDiscount,
        total,
        pointsEarned,
        cogs: totalCogs,
        grossProfit: total.sub(totalCogs),
        totalCommission,
        amountPaid,
        changeAmount,
      };
    }, {timeout: 30000 });
  }

  static async cancel(id: number, tenantId: number) {
    return prisma.$transaction(async (tx) => {

      const sale = await tx.sale.findFirst({
        where: { id, tenantId },
        include: {
          items: { include: { lots: true } },
          receivable: { include: { payments: true } },
        },
      });

      if (!sale) throw new Error(SaleError.SALE_NOT_FOUND);
      if (sale.status === SaleStatus.CANCELLED) throw new Error(SaleError.SALE_ALREADY_CANCELLED);

      if (sale.receivable) {
        if (sale.receivable.payments.length > 0) {
          throw new Error(SaleError.SALE_HAS_PAYMENTS);
        }
        await tx.accountReceivable.delete({
          where: { id: sale.receivable.id },
        });
      }

      for (const item of sale.items) {
        for (const allocation of item.lots) {
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

      const validMovements = originalMovements.filter(m => m.quantity > 0);

      for (const movement of validMovements) {
        await InventoryService.createMovementTX(tx, {
          tenantId,
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

      if (sale.customerId) {
        await LoyaltyService.rollbackPoints(tx, tenantId, sale.customerId, sale.id);
      }

      const originalCommissions = await tx.commission.findMany({
        where: { saleId: sale.id, type: CommissionType.SALE },
      });

      for (const commission of originalCommissions) {
        await tx.commission.create({
          data: {
            userId: commission.userId,
            tenantId,
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

  static async returnItems(
    saleId: number,
    userId: number,
    warehouseId: number,
    tenantId: number,
    data: ReturnSaleInput,
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Cargar la venta con sus ítems y lotes
      const sale = await tx.sale.findFirst({
        where: { id: saleId, tenantId },
        include: {
          items: { include: { lots: true, returnItems: true } },
          receivable: true,
        },
      });

      if (!sale) throw new Error(SaleError.SALE_NOT_FOUND);
      if (sale.status === SaleStatus.CANCELLED) throw new Error(SaleError.SALE_CANCELLED);

      // 2. Crear el encabezado de devolución
      const saleReturn = await tx.saleReturn.create({
        data: { saleId, userId, reason: data.reason },
      });

      let totalRefund = new Prisma.Decimal(0);
      let totalRefundSubtotal = new Prisma.Decimal(0);
      let totalRefundTax = new Prisma.Decimal(0);

      for (const input of data.items) {
        const saleItem = sale.items.find((i) => i.id === input.saleItemId);
        if (!saleItem) throw new Error(SaleError.RETURN_ITEM_NOT_FOUND);

        // Cantidad ya devuelta anteriormente
        const alreadyReturned = saleItem.returnItems.reduce((s, r) => s + r.quantity, 0);
        const maxReturnable = saleItem.quantity - alreadyReturned;

        if (input.quantity <= 0 || input.quantity > maxReturnable) {
          throw new Error(SaleError.RETURN_QUANTITY_EXCEEDS);
        }

        // Precio proporcional (lineTotal / quantity * qty_a_devolver)
        const unitTotal = new Prisma.Decimal(saleItem.lineTotal).div(saleItem.quantity);
        const refundAmount = unitTotal.mul(input.quantity).toDecimalPlaces(2);
        totalRefund = totalRefund.add(refundAmount);

        const unitSubtotal = new Prisma.Decimal(saleItem.lineSubtotal).div(saleItem.quantity);
        const refundSubtotal = unitSubtotal.mul(input.quantity).toDecimalPlaces(2);
        const refundTax = refundAmount.sub(refundSubtotal);
        totalRefundSubtotal = totalRefundSubtotal.add(refundSubtotal);
        totalRefundTax = totalRefundTax.add(refundTax);

        // Crear ítem de devolución
        await tx.saleReturnItem.create({
          data: {
            returnId: saleReturn.id,
            saleItemId: saleItem.id,
            quantity: input.quantity,
            refundAmount,
          },
        });

        // 3. Restaurar lotes FIFO proporcionalmente
        let qtyToRestore = input.quantity;
        // Recorrer los lotes del ítem de mayor a menor (LIFO para restaurar)
        for (const lot of [...saleItem.lots].reverse()) {
          if (qtyToRestore <= 0) break;
          const restore = Math.min(lot.quantity, qtyToRestore);
          await tx.purchaseItem.update({
            where: { id: lot.purchaseItemId },
            data: { quantity: { increment: restore } },
          });
          qtyToRestore -= restore;
        }

        // 4. Movimiento de inventario IN
        const unitCogs = new Prisma.Decimal(sale.cogs)
          .div(sale.items.reduce((s, i) => s + i.quantity, 0))
          .mul(input.quantity)
          .toDecimalPlaces(6);

        await InventoryService.createMovementTX(tx, {
          tenantId,
          productId: saleItem.productId,
          warehouseId,
          type: InventoryMovementType.IN,
          quantity: input.quantity,
          movementValue: unitCogs,
          referenceType: "SALE_RETURN",
          referenceId: saleReturn.id,
          note: `Devolución parcial venta ${sale.saleNumber}`,
        });

        // 5. Revertir comisión proporcional
        const commission = await tx.commission.findFirst({
          where: { saleId, saleItemId: saleItem.id, type: CommissionType.SALE },
        });

        if (commission) {
          const unitCommission = new Prisma.Decimal(commission.amount).div(saleItem.quantity);
          const reversalAmount = unitCommission.mul(input.quantity).toDecimalPlaces(2);
          await tx.commission.create({
            data: {
              userId: commission.userId,
              tenantId,
              saleId,
              saleItemId: saleItem.id,
              percent: commission.percent,
              amount: reversalAmount.neg(),
              type: CommissionType.REVERSAL,
            },
          });
        }
      }

      // 6. Si hay cuenta por cobrar, reducir el balance
      if (sale.receivable) {
        const newBalance = new Prisma.Decimal(sale.receivable.balance).sub(totalRefund);
        const newStatus = newBalance.lte(0)
          ? "PAID"
          : sale.receivable.paidAmount.gt(0) ? "PARTIAL" : "PENDING";
        await tx.accountReceivable.update({
          where: { id: sale.receivable.id },
          data: {
            balance: newBalance.lt(0) ? 0 : newBalance,
            status: newStatus,
          },
        });
      }

      // 7. Actualizar totales de la venta (siempre, sin importar el método de pago)
      const newTotal    = new Prisma.Decimal(sale.total).sub(totalRefund);
      const newSubtotal = new Prisma.Decimal(sale.subtotal).sub(totalRefundSubtotal);
      const newTaxTotal = new Prisma.Decimal(sale.taxTotal).sub(totalRefundTax);

      // cogs proporcional: unitCogs ya se calcula por item en el loop, acumularlo aquí
      const totalOriginalQty = sale.items.reduce((s, i) => s + i.quantity, 0);
      const totalRefundedCogs = data.items.reduce((acc, input) => {
        const unitCogs = new Prisma.Decimal(sale.cogs)
          .div(totalOriginalQty)
          .mul(input.quantity)
          .toDecimalPlaces(6);
        return acc.add(unitCogs);
      }, new Prisma.Decimal(0));

      await tx.sale.update({
        where: { id: saleId },
        data: {
          total:    newTotal.lte(0)    ? new Prisma.Decimal(0) : newTotal,
          subtotal: newSubtotal.lte(0) ? new Prisma.Decimal(0) : newSubtotal,
          taxTotal: newTaxTotal.lte(0) ? new Prisma.Decimal(0) : newTaxTotal,
          cogs:     new Prisma.Decimal(sale.cogs).sub(totalRefundedCogs),
        },
      });

      return { saleReturn, totalRefund };
    });
  }
}