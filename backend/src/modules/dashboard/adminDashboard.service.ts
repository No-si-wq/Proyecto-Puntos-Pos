import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import prisma from "../../core/prisma";

function getTodayRange(): { gte: Date; lte: Date } {
  const timeZone = 'America/Tegucigalpa';
  const now = new Date();

  const zonedNow = toZonedTime(now, timeZone);

  return {
    gte: fromZonedTime(startOfDay(zonedNow), timeZone),
    lte: fromZonedTime(endOfDay(zonedNow), timeZone),
  };
}

export class AdminDashboardService {

  static async getDashboard(tenantId: number) {

    const todayFilter = { createdAt: getTodayRange() };

    const [
      financial,
      salesByWarehouse,
      inventoryValue,
      topProducts,
      metrics,
      reorderAlerts,
    ] = await Promise.all([
      this.getFinancialSummary(todayFilter, tenantId),
      this.getSalesByWarehouse(todayFilter, tenantId),
      this.getInventoryValue(tenantId),
      this.getTopProducts(todayFilter, tenantId),
      this.getExecutiveMetrics(todayFilter, tenantId),
      this.getReorderAlerts(tenantId),
    ]);

    return {
      financial,
      salesByWarehouse,
      inventoryValue,
      topProducts,
      metrics,
      reorderAlerts,
    };
  }

  private static async getFinancialSummary(dateFilter: any, tenantId: number) {

    const [salesAgg, purchaseAgg] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          tenantId,
          status: "COMPLETED",
          ...dateFilter,
        },
        _sum: {
          total: true,
          cogs: true,
        },
        _count: true,
      }),
      prisma.purchase.aggregate({
        where: { tenantId, ...dateFilter },
        _sum: {
          total: true,
        },
      }),
    ]);

    const revenue = Number(salesAgg._sum.total ?? 0);
    const totalCogs = Number(salesAgg._sum.cogs ?? 0);
    const expenses = Number(purchaseAgg._sum.total ?? 0);

    const grossProfit = revenue - totalCogs;
    const net = revenue - expenses;
    const margin =
      revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      revenue,
      totalCogs,
      expenses,
      grossProfit,
      net,
      margin,
      totalSalesCount: salesAgg._count,
    };
  }

  private static async getSalesByWarehouse(dateFilter: any, tenantId: number) {

    const grouped = await prisma.sale.groupBy({
      by: ["warehouseId"],
      where: {
        status: "COMPLETED",
        tenantId,
        ...dateFilter,
      },
      _sum: {
        total: true,
        cogs: true,
      },
      _count: true,
    });

    const warehouses = await prisma.warehouse.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const map = new Map(
      warehouses.map(w => [w.id, w.name])
    );

    return grouped.map(g => {
      const revenue = Number(g._sum.total ?? 0);
      const cogs = Number(g._sum.cogs ?? 0);

      return {
        warehouseId: g.warehouseId,
        warehouseName: map.get(g.warehouseId) ?? "N/A",
        revenue,
        cogs,
        profit: revenue - cogs,
        salesCount: g._count,
      };
    });
  }

  private static async getInventoryValue(tenantId: number) {
    
    const lots = await prisma.purchaseItem.findMany({
      where: {
        tenantId,
        quantity: { gt: 0 },
        purchase: {
          tenantId,
          status: "ACTIVE",
        },
      },
      select: {
        quantity: true,
        cost: true,
      },
    });

    const totalValue = lots.reduce(
      (sum, l) =>
        sum + l.quantity * l.cost.toNumber(),
      0
    );

    return totalValue;
  }

  private static async getTopProducts(dateFilter: any, tenantId: number) {
    const grouped = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { tenantId, status: "COMPLETED", ...dateFilter } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    // --- AÑADIR: obtener cantidades devueltas por producto ---
    const returnedItems = await prisma.saleReturnItem.findMany({
      where: {
        saleItem: {
          sale: { tenantId, status: "COMPLETED", ...dateFilter },
        },
      },
      select: {
        quantity: true,
        saleItem: { select: { productId: true } },
      },
    });

    const returnedMap = new Map<number, number>();
    for (const r of returnedItems) {
      const pid = r.saleItem.productId;
      returnedMap.set(pid, (returnedMap.get(pid) ?? 0) + r.quantity);
    }
    // --------------------------------------------------------

    const productIds = grouped.map((g) => g.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, tenantId },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p.name]));

    return grouped
      .map((g) => ({
        productId: g.productId,
        name: productMap.get(g.productId) ?? "N/A",
        // Cantidad neta = vendida - devuelta
        totalSold: (g._sum.quantity ?? 0) - (returnedMap.get(g.productId) ?? 0),
      }))
      .filter((p) => p.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold);
  }

  private static async getExecutiveMetrics(dateFilter: any, tenantId: number) {

    const sales = await prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        tenantId,
        ...dateFilter,
      },
      select: {
        total: true,
        cogs: true,
      },
    });

    const totalRevenue = sales.reduce(
      (sum, s) => sum + Number(s.total),
      0
    );

    const totalCogs = sales.reduce(
      (sum, s) => sum + Number(s.cogs ?? 0),
      0
    );

    const averageTicket =
      sales.length > 0
        ? totalRevenue / sales.length
        : 0;

    const inventoryValue = await this.getInventoryValue(tenantId);

    const inventoryTurnover =
      totalCogs > 0 && inventoryValue > 0
        ? totalCogs / inventoryValue
        : 0;

    return {
      averageTicket,
      inventoryTurnover,
    };
  }
  private static async getReorderAlerts(tenantId: number) {
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        active: true,
        reorderPoint: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        laboratory: true,
        reorderPoint: true,
        purchaseItems: {
          where: { quantity: { gt: 0 } },
          select: { quantity: true },
        },
      },
    });
 
    const alerts = products
      .map(p => {
        const currentStock = p.purchaseItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        return {
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          currentStock,
          laboratory: p.laboratory,
          reorderPoint: p.reorderPoint,
        };
      })
      .filter(p => p.currentStock <= p.reorderPoint)
      .sort((a, b) => a.currentStock - b.currentStock);
 
    return {
      count: alerts.length,
      items: alerts,
    };
  }
}