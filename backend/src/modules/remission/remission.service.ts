import prisma from '../../core/prisma';
import { Prisma } from '@prisma/client';
import { CreateRemissionDto, RemissionError } from './remission';
import { InventoryService } from '../inventory/inventory.service';

async function generateRemissionNumber(tenantId: number): Promise<string> {
  const count = await prisma.remission.count({ where: { tenantId } });
  const seq = String(count + 1).padStart(6, '0');
  return `REM-${seq}`;
}

export const remissionService = {
  async create(tenantId: number, userId: number, dto: CreateRemissionDto) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, tenantId, active: true },
    });
    if (!warehouse) throw RemissionError.WAREHOUSE_NOT_FOUND;

    const productIds = dto.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, tenantId, active: true },
    });
    if (products.length !== productIds.length) throw RemissionError.INVALID_PRODUCT;

    const remissionNumber = await generateRemissionNumber(tenantId);

    return prisma.$transaction(async (tx) => {
      const created = await tx.remission.create({
        data: {
          tenantId,
          userId,
          warehouseId: dto.warehouseId,
          customerName: dto.customerName,
          note: dto.note,
          remissionNumber,
          status: 'PENDING',
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              note: item.note,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          warehouse: true,
          user: { select: { id: true, name: true, username: true } },
        },
      });

      return created;
    });
  },

  async findAll(tenantId: number, warehouseId?: number) {
    return prisma.remission.findMany({
      where: {
        tenantId,
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        warehouse: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, username: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findOne(tenantId: number, id: number) {
    const remission = await prisma.remission.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        warehouse: true,
        user: { select: { id: true, name: true, username: true } },
      },
    });
    if (!remission) throw RemissionError.NOT_FOUND;
    return remission;
  },

  async cancel(tenantId: number, id: number) {
    const remission = await prisma.remission.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!remission) throw RemissionError.NOT_FOUND;
    if (remission.status === 'CANCELLED') throw RemissionError.ALREADY_CANCELLED;

    return prisma.$transaction(async (tx) => {
      await tx.remission.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Solo se revierte inventario si ya fue entregada (el stock se consumió en deliver)
      if (remission.status === 'DELIVERED') {
        for (const item of remission.items) {
          const product = await tx.product.findFirst({
            where: { id: item.productId, tenantId },
            select: { cost: true },
          });
          const unitCost = new Prisma.Decimal(product?.cost ?? 0);
          const movementValue = unitCost.mul(item.quantity);

          // Devolver stock creando un nuevo lote de ajuste
          const supplier = await tx.supplier.upsert({
            where: { tenantId_name: { tenantId, name: '__SYSTEM_NEGATIVE_STOCK__' } },
            update: {},
            create: { tenantId, name: '__SYSTEM_NEGATIVE_STOCK__', active: true },
            select: { id: true },
          });

          const purchase = await tx.purchase.create({
            data: {
              tenantId,
              total: movementValue,
              supplierId: supplier.id,
              warehouseId: remission.warehouseId,
              paymentMethod: 'CASH',
              status: 'ACTIVE',
              purchaseNumber: `REMISSION-CANCEL-${id}-${Date.now()}`,
            },
            select: { id: true },
          });

          await tx.purchaseItem.create({
            data: {
              tenantId,
              purchaseId: purchase.id,
              productId: item.productId,
              warehouseId: remission.warehouseId,
              quantity: item.quantity,
              cost: unitCost,
              lotNumber: 'REMISSION-CANCEL',
            },
          });

          await InventoryService.createMovementTX(tx, {
            tenantId,
            productId: item.productId,
            warehouseId: remission.warehouseId,
            type: 'IN',
            quantity: item.quantity,
            movementValue,
            referenceType: 'REMISSION_CANCEL',
            referenceId: id,
            note: `Cancelación remisión ${remission.remissionNumber}`,
          });
        }
      }
    });
  },

  async deliver(tenantId: number, id: number) {
    const remission = await prisma.remission.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!remission) throw RemissionError.NOT_FOUND;
    if (remission.status !== 'PENDING') throw RemissionError.NOT_PENDING;

    return prisma.$transaction(async (tx) => {
      await tx.remission.update({
        where: { id },
        data: { status: 'DELIVERED' },
      });

      for (const item of remission.items) {
        let remaining = item.quantity;
        let totalCost = new Prisma.Decimal(0);

        const lots = await tx.purchaseItem.findMany({
          where: { tenantId, productId: item.productId, warehouseId: remission.warehouseId },
          orderBy: [{ purchase: { createdAt: 'asc' } }],
        });

        for (const lot of lots) {
          if (remaining <= 0) break;
          if (lot.quantity <= 0) continue;
          const deduct = Math.min(lot.quantity, remaining);
          await tx.purchaseItem.update({
            where: { id: lot.id },
            data: { quantity: { decrement: deduct } },
          });
          totalCost = totalCost.add(new Prisma.Decimal(lot.cost).mul(deduct));
          remaining -= deduct;
        }

        // Permite stock negativo igual que en ventas
        if (remaining > 0 && lots.length > 0) {
          await tx.purchaseItem.update({
            where: { id: lots[0].id },
            data: { quantity: { decrement: remaining } },
          });
          totalCost = totalCost.add(new Prisma.Decimal(lots[0].cost).mul(remaining));
        }

        await InventoryService.createMovementTX(tx, {
          tenantId,
          productId: item.productId,
          warehouseId: remission.warehouseId,
          type: 'OUT',
          quantity: item.quantity,
          movementValue: totalCost,
          referenceType: 'REMISSION',
          referenceId: id,
          note: `Remisión ${remission.remissionNumber}`,
        });
      }
    });
  },
};