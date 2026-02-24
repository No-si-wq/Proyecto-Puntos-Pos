import prisma from "../config/prisma";

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
}