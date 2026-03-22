import prisma from "../../core/prisma";

function getTodayRange(): { gte: Date; lte: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

export class AdminDashboardService {

  static async getDashboard() {

    const todayFilter = { createdAt: getTodayRange() };

    const [
      financial,
      salesByWarehouse,
      inventoryValue,
      topProducts,
      metrics,
      reorderAlerts,
    ] = await Promise.all([
      this.getFinancialSummary(todayFilter),
      this.getSalesByWarehouse(todayFilter),
      this.getInventoryValue(todayFilter),
      this.getTopProducts(todayFilter),
      this.getExecutiveMetrics(todayFilter),
      this.getReorderAlerts(),
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

  private static async getFinancialSummary(dateFilter: any) {

    const [salesAgg, purchaseAgg] = await Promise.all([
      prisma.sale.aggregate({
        where: {
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
        where: dateFilter,
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

  private static async getSalesByWarehouse(dateFilter: any) {

    const grouped = await prisma.sale.groupBy({
      by: ["warehouseId"],
      where: {
        status: "COMPLETED",
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

  private static async getInventoryValue(dateFilter: any) {

    const lots = await prisma.purchaseItem.findMany({
      where: {
        quantity: { gt: 0 },
        purchase: dateFilter,
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

  private static async getTopProducts(dateFilter: any) {

    const grouped = await prisma.saleItem.groupBy({
      where: {
        sale: dateFilter,
      },
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    });

    const productIds = grouped.map(g => g.productId);

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const productMap = new Map(
      products.map(p => [p.id, p.name])
    );

    return grouped.map(g => ({
      productId: g.productId,
      name: productMap.get(g.productId) ?? "N/A",
      totalSold: g._sum.quantity ?? 0,
    }));
  }

  private static async getExecutiveMetrics(dateFilter: any) {

    const sales = await prisma.sale.findMany({
      where: {
        status: "COMPLETED",
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

    const inventoryValue = await this.getInventoryValue(dateFilter);

    const inventoryTurnover =
      totalCogs > 0 && inventoryValue > 0
        ? totalCogs / inventoryValue
        : 0;

    return {
      averageTicket,
      inventoryTurnover,
    };
  }

  private static async getReorderAlerts() {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        reorderPoint: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        sku: true,
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