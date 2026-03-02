import prisma from "../config/prisma";
import { KardexPagination, ProfitSummaryRow } from "../types/report";

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
      page: number;
      pageSize: number;
    }
  ) {
    const { productId, from, to, page, pageSize } = params;

    const offset = (page - 1) * pageSize;

    const result = await prisma.$queryRaw<any[]>`
      WITH initial_balance AS (
        SELECT
          COALESCE(SUM(
            CASE WHEN type = 'IN'
                THEN quantity
                ELSE -quantity
            END
          ), 0) AS qty,
          COALESCE(SUM(
            CASE WHEN type = 'IN'
                THEN movement_value
                ELSE -movement_value
            END
          ), 0) AS value
        FROM inventory_ledger
        WHERE "productId" = ${productId}
          AND "warehouseId" = ${warehouseId}
          AND date < ${from}
      ),

      movements AS (
        SELECT *
        FROM inventory_ledger
        WHERE "productId" = ${productId}
          AND "warehouseId" = ${warehouseId}
          AND date BETWEEN ${from} AND ${to}
      ),

      calculated AS (
        SELECT
          m.*,
          (ib.qty +
            SUM(
              CASE WHEN m.type = 'IN'
                  THEN m.quantity
                  ELSE -m.quantity
              END
            ) OVER (
              ORDER BY m.date, m.unique_id
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            )
          )::double precision AS balance_qty,

          (ib.value +
            SUM(
              CASE WHEN m.type = 'IN'
                  THEN m.movement_value
                  ELSE -m.movement_value
              END
            ) OVER (
              ORDER BY m.date, m.unique_id
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            )
          )::double precision AS balance_value

        FROM movements m
        CROSS JOIN initial_balance ib
      )

      SELECT *
      FROM calculated
      ORDER BY date ASC, unique_id ASC
      LIMIT ${pageSize}
      OFFSET ${offset};
    `;

    const totalCount = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count
      FROM inventory_ledger
      WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
        AND date BETWEEN ${from} AND ${to};
    `;

    const initialBalance = await prisma.$queryRaw<any[]>`
      SELECT
        COALESCE(SUM(
          CASE WHEN type = 'IN'
              THEN quantity
              ELSE -quantity
          END
        ), 0) AS qty,
        COALESCE(SUM(
          CASE WHEN type = 'IN'
              THEN movement_value
              ELSE -movement_value
          END
        ), 0) AS value
      FROM inventory_ledger
      WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
        AND date < ${from};
    `;

    return {
      initialBalance: {
        quantity: Number(initialBalance[0].qty),
        value: Number(initialBalance[0].value),
      },
      movements: result,
      total: Number(totalCount[0].count),
      page,
      pageSize,
    };
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