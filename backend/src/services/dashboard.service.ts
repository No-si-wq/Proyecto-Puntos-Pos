import prisma from "../config/prisma";
import dayjs from "dayjs";

export class DashboardService {
  static async getSummary(warehouseId: number) {
    const todayStart = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();

    const [
      todaySales,
      todayPurchases,
      lowStock,
      expiring,
      topProducts,
    ] = await Promise.all([

      prisma.sale.aggregate({
        where: {
          warehouseId,
          status: "COMPLETED",
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _count: true,
        _sum: { total: true },
      }),

      prisma.purchase.aggregate({
        where: {
          warehouseId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _count: true,
        _sum: { total: true },
      }),

    prisma.$queryRaw<
      {
        id: number;
        name: string;
        sku: string;
        stock: number;
      }[]
    >`
      SELECT 
        p."id",
        p."name",
        p."sku",
        COALESCE(SUM(pi."quantity"), 0)::int AS stock
      FROM "Product" p
      LEFT JOIN "PurchaseItem" pi
        ON pi."productId" = p."id"
        AND pi."warehouseId" = ${warehouseId}
      WHERE p."active" = true
      GROUP BY p."id"
      HAVING COALESCE(SUM(pi."quantity"), 0) <= 10
      ORDER BY stock ASC
    `,

      prisma.purchaseItem.findMany({
        where: {
          quantity: { gt: 0 },
          warehouseId,
          expiresAt: {
            not: null,
            lte: dayjs().add(60, "day").toDate(),
          },
        },
        include: {
          product: {
            select: { id: true, name: true },
          },
        },
        orderBy: { expiresAt: "asc" },
      }),

      prisma.$queryRaw<
        {
          productId: number;
          name: string;
          quantity: number;
        }[]
      >`
        SELECT 
          si."productId",
          p."name",
          SUM(si."quantity")::int AS quantity
        FROM "SaleItem" si
        INNER JOIN "Sale" s ON s."id" = si."saleId"
        INNER JOIN "Product" p ON p."id" = si."productId"
        WHERE 
          s."warehouseId" = ${warehouseId}
          AND s."status" = 'COMPLETED'
          AND s."createdAt" BETWEEN ${todayStart} AND ${todayEnd}
        GROUP BY si."productId", p."name"
        ORDER BY quantity DESC
        LIMIT 5
      `,
    ]);
    
    return {
      metrics: {
        salesToday: todaySales._count,
        purchasesToday: todayPurchases._count,
        incomeToday: todaySales._sum.total ?? 0,
        expenseToday: todayPurchases._sum.total ?? 0,
        balanceToday:
          (todaySales._sum.total?.toNumber() ?? 0) -
          (todayPurchases._sum.total?.toNumber() ?? 0),
      },
      lowStock,
      expiring,
      topProducts,
    };
  }
}