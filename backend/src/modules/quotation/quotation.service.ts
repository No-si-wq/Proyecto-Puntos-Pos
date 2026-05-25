import prisma from '../../core/prisma';
import { CreateQuotationInput } from './quotation';

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

  async updateStatus(tenantId: number, id: number, status: 'ACCEPTED' | 'REJECTED' | 'EXPIRED') {
    const quotation = await prisma.quotation.findFirst({ where: { tenantId, id } });
    if (!quotation) throw new Error('Cotización no encontrada');
    if (quotation.status === 'CONVERTED') throw new Error('La cotización ya fue convertida');
    return prisma.quotation.update({ where: { id }, data: { status } });
  }

  async convertToSale(tenantId: number, id: number, userId: number, paymentMethod: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { tenantId, id },
      include: { items: true },
    });
    if (!quotation) throw new Error('Cotización no encontrada');
    if (quotation.status === 'CONVERTED') throw new Error('Ya fue convertida');

    // Generar número de venta
    const saleCount = await prisma.sale.count({ where: { tenantId } });
    const saleNumber = `V-${String(saleCount + 1).padStart(6, '0')}`;

    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          tenantId,
          userId,
          saleNumber,
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
          items: {
            create: quotation.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.price,
              discountAmount: i.discountAmount,
              discountType: i.discountType,
              discountValue: i.discountValue,
              lineSubtotal: i.lineSubtotal,
              tax: i.tax,
              taxAmount: i.taxAmount,
              lineTotal: i.lineTotal,
            })),
          },
        },
      });

      await tx.quotation.update({
        where: { id },
        data: { status: 'CONVERTED', convertedSaleId: sale.id },
      });

      return sale;
    });
  }
}