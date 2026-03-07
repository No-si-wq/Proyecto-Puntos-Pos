import prisma from "../../core/prisma";
import { ProfitSummaryRow } from "./report";
import { Prisma } from "@prisma/client";

export class ReportService {
  static async listLots(
    warehouseId: number,
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
    params: {
      from: Date;
      to: Date;
    }
  ) {
    const { from, to } = params;

    const details = await prisma.$queryRawUnsafe(`
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
        AND s.status = 'COMPLETED'
        AND s."createdAt" BETWEEN '${from.toISOString()}'
        AND '${to.toISOString()}'
      ORDER BY s."createdAt" ASC
    `);

    const summary = await prisma.$queryRawUnsafe<ProfitSummaryRow[]>(`
      SELECT
        COALESCE(SUM(s.total), 0) AS "totalSales",
        COALESCE(SUM(s.cogs), 0) AS "totalCogs",
        COALESCE(SUM(s.total - s.cogs), 0) AS "totalProfit",
        COALESCE(
          CASE 
            WHEN SUM(s.total) > 0
            THEN (SUM(s.total - s.cogs) / SUM(s.total)) * 100
            ELSE 0
          END,
        0) AS margin
      FROM "Sale" s
      WHERE 
        s."warehouseId" = ${warehouseId}
        AND s.status = 'COMPLETED'
        AND s."createdAt" BETWEEN '${from.toISOString()}'
        AND '${to.toISOString()}'
    `);

    return {
      summary: summary[0],
      details,
    };
  }
}