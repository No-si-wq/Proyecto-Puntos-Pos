import prisma from "../../core/prisma";
import { ProfitSummaryRow, ProfitDetailRow } from "./report";
import { Prisma } from "@prisma/client";

export class ReportService {
  static async listLots(
    warehouseId: number,
    tenantId: number,
    params?: {
      days?: number;
      expired?: boolean;
      product?: string;
    }
  ) {
    const today = new Date();

    let expiresFilter = {};

    if (params?.expired) {
      expiresFilter = {
        expiresAt: { lt: today },
      };
    } else if (params?.days) {
      const limit = new Date();
      limit.setDate(limit.getDate() + params.days);

      expiresFilter = {
        expiresAt: {
          gte: today,
          lte: limit,
        },
      };
    }

    let productFilter = {};

    if (params?.product) {
      productFilter = {
        product: {
          name: {
            contains: params.product,
            mode: "insensitive",
          },
        },
      };
    }

    return prisma.purchaseItem.findMany({
      where: {
        quantity: { gt: 0 },
        tenantId,
        warehouseId,
        ...(params?.expired || params?.days
          ? expiresFilter
          : {}),
        ...(params?.product
          ? productFilter
          : {}),
      },
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
        purchase: {
          select: {
            id: true,
            purchaseNumber: true,
            createdAt: true,
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { expiresAt: "asc" },
    });
  }
  
  static async getKardexRaw(
    warehouseId: number,
    tenantId: number,
    params: {
      productId: number;
      from: Date;
      to: Date;
      pageSize: number;
      cursor?: {
        createdAt: Date;
        id: bigint;
      };
    }
  ) {

    const { productId, from, to, pageSize, cursor } = params;

    return prisma.$transaction(async (tx) => {

      const baseBalance = await tx.$queryRaw<
        { qty: string; value: string }[]
      >`
      SELECT
        COALESCE(SUM(
          CASE WHEN type='IN' THEN quantity ELSE -quantity END
        ),0)::numeric AS qty,

        COALESCE(SUM(
          CASE WHEN type='IN' THEN "movementValue" ELSE -"movementValue" END
        ),0)::numeric AS value

      FROM "InventoryLedger"
      WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
        AND "tenantId" = ${tenantId}
        AND (
          ${
            cursor
              ? Prisma.sql`("createdAt",id) < (${cursor.createdAt},${cursor.id})`
              : Prisma.sql`"createdAt" < ${from}`
          }
        )
      `;

      const baseQty = baseBalance[0]?.qty ?? "0";
      const baseValue = baseBalance[0]?.value ?? "0";

      const cursorFilter = cursor
        ? Prisma.sql`
          AND ("createdAt",id) > (${cursor.createdAt},${cursor.id})
        `
        : Prisma.sql``;

      const movements = await tx.$queryRaw<any[]>`
        SELECT
          m.*,

          (
            ${baseQty}::numeric +
            SUM(
              CASE WHEN m.type='IN'
                THEN m.quantity
                ELSE -m.quantity
              END
            ) OVER (
              ORDER BY m."createdAt",m.id
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            )
          )::numeric(20,6) AS balance_qty,

          (
            ${baseValue}::numeric +
            SUM(
              CASE WHEN m.type='IN'
                THEN m."movementValue"
                ELSE -m."movementValue"
              END
            ) OVER (
              ORDER BY m."createdAt",m.id
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            )
          )::numeric(20,6) AS balance_value

        FROM "InventoryLedger" m

        WHERE m."productId" = ${productId}
          AND m."warehouseId" = ${warehouseId}
          AND M."tenantId" = ${tenantId}
          AND m."createdAt" >= ${from}
          AND m."createdAt" < ${to}
          ${cursorFilter}

        ORDER BY m."createdAt",m.id
        LIMIT ${pageSize}
      `;

      const safeMovements = movements.map(m => ({
        ...m,
        id: m.id.toString()
      }));

      const nextCursor =
        safeMovements.length === pageSize
          ? {
              createdAt: safeMovements[safeMovements.length - 1].createdAt,
              id: safeMovements[safeMovements.length - 1].id
            }
          : null;

      return {
        baseBalance: {
          quantity: Number(baseQty),
          value: Number(baseValue)
        },
        movements: safeMovements,
        pageSize,
        nextCursor
      };

    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead
    });

  }

  static async getProfitReportRaw(
    warehouseId: number,
    tenantId: number,
    params: {
      from: Date;
      to: Date;
    }
  ) {
    const { from, to } = params;

    const details = await prisma.$queryRaw<ProfitDetailRow[]>`
      SELECT 
        s."saleNumber",
        s."createdAt" AS date,
        s.total,
        s.cogs,
        (s.total - s.cogs) AS profit,
        CASE 
          WHEN s.total > 0 
          THEN ((s.total - s.cogs) / s.total) * 100
          ELSE 0
        END AS margin,
        COALESCE(c.name, 'General') AS customer,
        u.name AS seller
      FROM "Sale" s
      LEFT JOIN "Customer" c ON c.id = s."customerId"
      INNER JOIN "User" u ON u.id = s."userId"
      WHERE 
        s."warehouseId" = ${warehouseId}
        AND s."tenantId" = ${tenantId}
        AND s.status = 'COMPLETED'
        AND s."createdAt" >= ${from}
        AND s."createdAt" < ${to}
      ORDER BY s."createdAt" ASC
    `;

    const summary = await prisma.$queryRaw<ProfitSummaryRow[]>`
      SELECT
        u.name                                       AS seller,
        COALESCE(SUM(s.total), 0)                    AS "totalSales",
        COALESCE(SUM(s.cogs), 0)                     AS "totalCogs",
        COALESCE(SUM(s.total - s.cogs), 0)           AS "totalProfit",
        CASE 
          WHEN SUM(s.total) > 0
          THEN (SUM(s.total - s.cogs) / SUM(s.total)) * 100
          ELSE 0
        END                                          AS margin
      FROM "Sale" s
      INNER JOIN "User" u ON u.id = s."userId"
      WHERE 
        s."warehouseId" = ${warehouseId}
        AND s."tenantId" = ${tenantId}
        AND s.status = 'COMPLETED'
        AND s."createdAt" >= ${from}
        AND s."createdAt" < ${to}
      GROUP BY u.id, u.name
      ORDER BY "totalProfit" DESC
    `;

    return {
      summary,
      details,
    };
  }

  static async getSoldProductsReport(filters: {
    from: Date;
    to: Date;
    warehouseId?: number;
  }) {
    const { from, to, warehouseId } = filters;

    const items = await prisma.saleItem.findMany({
      where: {
        sale: {
          status: 'COMPLETED',
          createdAt: { gte: from, lte: to },
          ...(warehouseId ? { warehouseId } : {}),
        },
      },
      select: {
        quantity: true,
        lineSubtotal: true,
        lineTotal: true,
        taxAmount: true,
        discountAmount: true,
        returnItems: {
          select: { quantity: true, refundAmount: true },
        },
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            price: true,
            cost: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    // Agrupar por productId
    const map = new Map<number, {
      productId: number;
      sku: string;
      name: string;
      category: string;
      cost: number;
      quantitySold: number;
      subtotal: number;      // antes de descuentos e impuestos
      totalDiscount: number;
      totalTax: number;
      revenue: number;       // lineTotal (neto final)
      cogs: number;          // cost × quantity
      grossProfit: number;
      margin: number;        // %
      price: number;
    }>();

    // 2. En el loop de cálculo, descontar lo devuelto
    for (const item of items) {
      const pid   = item.product.id;
      const cost  = Number(item.product.cost);
      const price = Number(item.product.price);

      // --- AÑADIR: calcular devoluciones del ítem ---
      const returnedQty    = item.returnItems.reduce((s, r) => s + r.quantity, 0);
      const refundedAmount = item.returnItems.reduce((s, r) => s + Number(r.refundAmount), 0);
      // -----------------------------------------------

      const qty          = item.quantity - returnedQty;          // neto
      const lineTotal    = Number(item.lineTotal) - refundedAmount; // neto
      const lineSubtotal = Number(item.lineSubtotal) - (
        // subtotal proporcional devuelto
        item.quantity > 0
          ? (Number(item.lineSubtotal) / item.quantity) * returnedQty
          : 0
      );
      const discount = Number(item.discountAmount);
      const tax      = Number(item.taxAmount);
      const cogs     = cost * qty;  // cogs sobre cantidad neta

      if (qty <= 0) continue;  // si todo fue devuelto, omitir

      if (!map.has(pid)) {
        map.set(pid, {
          productId: pid,
          sku: item.product.sku,
          name: item.product.name,
          category: item.product.category.name,
          cost, price,
          quantitySold: 0, subtotal: 0, totalDiscount: 0,
          totalTax: 0, revenue: 0, cogs: 0, grossProfit: 0, margin: 0,
        });
      }

      const row = map.get(pid)!;
      row.quantitySold  += qty;
      row.subtotal      += lineSubtotal;
      row.totalDiscount += discount;
      row.totalTax      += tax;
      row.revenue       += lineTotal;
      row.cogs          += cogs;
    }

    // Calcular margen final
    const result = Array.from(map.values()).map(row => {
      row.grossProfit = row.revenue - row.cogs;
      row.margin = row.revenue > 0
        ? (row.grossProfit / row.revenue) * 100
        : 0;
      return row;
    });

    // Ordenar por revenue desc
    result.sort((a, b) => b.revenue - a.revenue);

    return result;
  }

  static async getProductOutputsReport(params: {
    tenantId: number;
    warehouseId: number;
    from: Date;
    to: Date;
  }) {
    const { tenantId, warehouseId, from, to } = params;

    const rows = await prisma.$queryRaw<{
      productId: bigint;
      sku: string;
      name: string;
      category: string;
      totalQuantity: bigint;
      totalValue: string;
      movementCount: bigint;
    }[]>`
      SELECT
        p.id              AS "productId",
        p.sku,
        p.name,
        cat.name          AS category,
        SUM(l.quantity)   AS "totalQuantity",
        COALESCE(SUM(l."movementValue"), 0)::numeric AS "totalValue",
        COUNT(*)          AS "movementCount"
      FROM "InventoryLedger" l
      INNER JOIN "Product"  p   ON p.id  = l."productId"
      INNER JOIN "Category" cat ON cat.id = p."categoryId"
      WHERE l."tenantId"    = ${tenantId}
        AND l."warehouseId" = ${warehouseId}
        AND l.type          = 'OUT'
        AND l."createdAt"  >= ${from}
        AND l."createdAt"  <  ${to}
      GROUP BY p.id, p.sku, p.name, cat.name
      ORDER BY SUM(l.quantity) DESC
    `;

    return rows.map((r) => ({
      productId:     Number(r.productId),
      sku:           r.sku,
      name:          r.name,
      category:      r.category,
      totalQuantity: Number(r.totalQuantity),
      totalValue:    Number(r.totalValue),
      movementCount: Number(r.movementCount),
    }));
  }

  static async getGeneralInventoryReport(tenantId: number) {
    const rows = await prisma.$queryRaw<{
      productId: bigint;
      sku: string;
      name: string;
      category: string;
      cost: string;
      reorderPoint: bigint;
      stock: string;
    }[]>`
      SELECT
        p.id                AS "productId",
        p.sku,
        p.name,
        cat.name            AS category,
        p.cost::numeric     AS cost,
        p."reorderPoint",
        COALESCE(SUM(
          CASE
            WHEN l.type = 'IN'  THEN  l.quantity
            WHEN l.type = 'OUT' THEN -l.quantity
            ELSE l.quantity
          END
        ), 0)               AS stock
      FROM "Product"  p
      INNER JOIN "Category" cat ON cat.id = p."categoryId"
      LEFT JOIN "InventoryLedger" l
        ON l."productId" = p.id AND l."tenantId" = ${tenantId}
      WHERE p."tenantId" = ${tenantId}
        AND p.active = true
      GROUP BY p.id, p.sku, p.name, cat.name, p.cost, p."reorderPoint"
      ORDER BY cat.name, p.name
    `;

    return rows.map((r) => {
      const stock      = Number(r.stock);
      const cost       = Number(r.cost);
      const reorder    = Number(r.reorderPoint);
      return {
        productId:    Number(r.productId),
        sku:          r.sku,
        name:         r.name,
        category:     r.category,
        stock,
        cost,
        totalValue:   stock * cost,
        reorderPoint: reorder,
        belowReorder: stock <= reorder,
      };
    });
  }  
}