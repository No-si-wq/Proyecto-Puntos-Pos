import prisma from '../../core/prisma';
import { InventoryMovementType, Prisma } from '@prisma/client';
import { CreateQuotationInput } from './quotation';
import { buildFiscalNumber, validateFiscalRange, isFiscalConfigExpired, extractSequence } from '../../utils/fiscal.util';
import { InventoryService } from '../inventory/inventory.service';

export class QuotationService {
  async getAll(tenantId: number) {
    return prisma.quotation.findMany({
      where: { tenantId },
      include: {
        customer: { select: { id: true, name: true, direction: true, dni: true, phone: true, } },
        user: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(tenantId: number, id: number) {

    await prisma.quotation.updateMany({
      where: {
        tenantId,
        id,
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    const quotation = await prisma.quotation.findFirst({
      where: { tenantId, id },
      include: {
        customer: { select: { id: true, name: true, direction: true, dni: true, phone: true, } },
        user: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        priceList: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
        convertedSale: { select: { id: true, saleNumber: true } },
      },
    });
    if (!quotation) throw new Error('Cotización no encontrada');
    return quotation;
  }

  async create(tenantId: number, userId: number, data: CreateQuotationInput) {
    // Generar número de cotización
    const count = await prisma.quotation.count({ where: { tenantId } });
    const quotationNumber = `COT-${String(count + 1).padStart(6, '0')}`;

    const items = data.items.map((item) => {
      const discountAmount =
        item.discountType === 'PERCENTAGE'
          ? (item.price * item.quantity * item.discountValue!) / 100
          : item.discountType === 'FIXED'
          ? item.discountValue! * item.quantity
          : 0;
      const lineSubtotal = item.price * item.quantity - discountAmount;
      const taxAmount = (lineSubtotal * (item.tax ?? 0)) / 100;
      const lineTotal = lineSubtotal + taxAmount;
      return { ...item, discountAmount, lineSubtotal, taxAmount, lineTotal };
    });

    const subtotal = items.reduce((s, i) => s + i.lineSubtotal, 0);
    const taxTotal = items.reduce((s, i) => s + i.taxAmount, 0);
    const total = subtotal + taxTotal;

    return prisma.quotation.create({
      data: {
        tenantId,
        userId,
        quotationNumber,
        subtotal,
        taxTotal,
        total,
        customerId: data.customerId,
        warehouseId: data.warehouseId,
        priceListId: data.priceListId,
        sellerId: data.sellerId,
        observations: data.observations,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        items: { create: items },
      },
    });
  }

  async updateStatus(tenantId: number, id: number, status: 'REJECTED') {
    const quotation = await prisma.quotation.findFirst({ where: { tenantId, id } });
    if (!quotation) throw new Error('Cotización no encontrada');
    if (quotation.status === 'CONVERTED') throw new Error('La cotización ya fue convertida');
    return prisma.quotation.update({ where: { id }, data: { status } });
  }

  async expireOverdue() {
    return prisma.quotation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
  }

  async convertToSale(tenantId: number, id: number, userId: number, paymentMethod: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { tenantId, id },
      include: { items: true },
    });
    if (!quotation) throw new Error('Cotización no encontrada');
    if (quotation.status === 'CONVERTED') throw new Error('Ya fue convertida');

    return prisma.$transaction(async (tx) => {
      // 1. Buscar FiscalConfig activo — opcional
      const fiscalConfig = await tx.fiscalConfig.findFirst({
        where: { tenantId, active: true },
      });

      if (fiscalConfig && isFiscalConfigExpired(fiscalConfig.expiresAt)) {
        throw new Error('La configuración fiscal (CAI) ha expirado');
      }

      // 1.1 Alinear secuencia si el CAI autoriza un rango que arranca más adelante
      if (fiscalConfig) {
        const rangeStartSeq = extractSequence(fiscalConfig.rangeStart);
        const existingSequence = await tx.saleSequence.findUnique({
          where: { warehouseId: quotation.warehouseId },
        });
        if (!existingSequence || existingSequence.current < rangeStartSeq - 1n) {
          await tx.saleSequence.upsert({
            where: { warehouseId: quotation.warehouseId },
            update: { current: rangeStartSeq - 1n },
            create: { tenantId, warehouseId: quotation.warehouseId, current: rangeStartSeq - 1n },
          });
        }
      }

      // 2. La secuencia siempre incrementa (con o sin CAI)
      const sequence = await tx.saleSequence.upsert({
        where: { warehouseId: quotation.warehouseId },
        update: { current: { increment: 1 } },
        create: { tenantId, warehouseId: quotation.warehouseId, current: 1 },
      });

      // 3. Construir número según si hay CAI o no
      let saleNumber: string;

      if (fiscalConfig) {
        saleNumber = buildFiscalNumber({
          establishment: fiscalConfig.establishment,
          emissionPoint: fiscalConfig.emissionPoint,
          documentType: fiscalConfig.documentType,
          sequence: sequence.current,
        });

        if (!validateFiscalRange(saleNumber, fiscalConfig.rangeStart, fiscalConfig.rangeEnd)) {
          throw new Error('El rango fiscal autorizado ha sido excedido');
        }
      } else {
        saleNumber = `FAC-${String(quotation.warehouseId).padStart(3, "0")}-${String(sequence.current).padStart(8, "0")}`;
      }

      const sale = await tx.sale.create({
        data: {
          tenantId,
          userId,
          saleNumber,
          fiscalConfigId: fiscalConfig?.id ?? null,
          subtotal: quotation.subtotal,
          discount: quotation.discount,
          total: quotation.total,
          grossSubtotal: quotation.subtotal,
          taxTotal: quotation.taxTotal,
          customerId: quotation.customerId,
          warehouseId: quotation.warehouseId,
          priceListId: quotation.priceListId,
          sellerId: quotation.sellerId,
          observations: quotation.observations,
          paymentMethod: paymentMethod as any,
        },
      });

      // Crear ítems individualmente para obtener sus IDs y consumir inventario FIFO
      let totalCogs = new Prisma.Decimal(0);

      for (const i of quotation.items) {
        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            priceListId: i.priceListId,
            discountAmount: i.discountAmount,
            discountType: i.discountType,
            discountValue: i.discountValue,
            lineSubtotal: i.lineSubtotal,
            tax: i.tax,
            taxAmount: i.taxAmount,
            lineTotal: i.lineTotal,
          },
        });

        const itemCogs = await InventoryService.consumeStockFIFO(
          tx, tenantId, saleItem.id, i.productId, quotation.warehouseId, i.quantity
        );

        totalCogs = totalCogs.add(itemCogs);

        await InventoryService.createMovementTX(tx, {
          tenantId,
          productId: i.productId,
          warehouseId: quotation.warehouseId,
          type: InventoryMovementType.OUT,
          quantity: i.quantity,
          movementValue: itemCogs,
          referenceType: 'SALE',
          referenceId: sale.id,
          note: `Venta ${saleNumber}`,
        });
      }

      await tx.sale.update({
        where: { id: sale.id },
        data: { cogs: totalCogs },
      });

      await tx.quotation.update({
        where: { id },
        data: { status: 'CONVERTED', convertedSaleId: sale.id },
      });

      return sale;
    });
  }
}