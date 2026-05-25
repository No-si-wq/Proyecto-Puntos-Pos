import prisma from "../../core/prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export class DashboardService {
  static async getSummary(warehouseId: number, tenantId: number) {
    const todayStart = dayjs().tz("America/Tegucigalpa").startOf("day").toDate();
    const todayEnd = dayjs().tz("America/Tegucigalpa").endOf("day").toDate();

    const [
      todaySales,
      todayPurchases,
      lowStock,
      expiring,
      topProducts,
    ] = await Promise.all([

      prisma.sale.aggregate({
        where: {
          tenantId,
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
          tenantId,
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
      INNER JOIN "PurchaseItem" pi
        ON pi."productId" = p."id"
        AND pi."warehouseId" = ${warehouseId}
      WHERE p."active" = true
      GROUP BY p."id"
      HAVING COALESCE(SUM(pi."quantity"), 0) <= 5
      ORDER BY stock ASC
    `,

      prisma.purchaseItem.findMany({
        where: {
          quantity: { gt: 0 },
          tenantId,
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