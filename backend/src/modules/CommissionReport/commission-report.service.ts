import prisma from "../../core/prisma";
import { Prisma } from "@prisma/client";
import { CommissionType } from "@prisma/client";

export interface CommissionReportRow {
  userId: number;
  userName: string;
  totalSales: number;
  earned: Prisma.Decimal;
  reversed: Prisma.Decimal;
  net: Prisma.Decimal;
}

export class CommissionReportService {
  static async getSummary(params?: {
    from?: Date;
    to?: Date;
  }): Promise<CommissionReportRow[]> {
    const dateFilter =
      params?.from && params?.to
        ? { createdAt: { gte: params.from, lte: params.to } }
        : {};

    const commissions = await prisma.commission.findMany({
      where: dateFilter,
      select: {
        userId: true,
        type: true,
        amount: true,
        saleId: true,
        user: { select: { name: true } },
      },
    });

    const map = new Map<
      number,
      {
        userId: number;
        userName: string;
        saleIds: Set<number>;
        earned: Prisma.Decimal;
        reversed: Prisma.Decimal;
      }
    >();

    for (const c of commissions) {
      if (!map.has(c.userId)) {
        map.set(c.userId, {
          userId: c.userId,
          userName: c.user.name ?? `Usuario ${c.userId}`,
          saleIds: new Set(),
          earned: new Prisma.Decimal(0),
          reversed: new Prisma.Decimal(0),
        });
      }

      const entry = map.get(c.userId)!;
      entry.saleIds.add(c.saleId);

      if (c.type === CommissionType.SALE) {
        entry.earned = entry.earned.add(c.amount);
      } else {
        entry.reversed = entry.reversed.add(c.amount.abs());
      }
    }

    const rows: CommissionReportRow[] = [];

    for (const entry of map.values()) {
      rows.push({
        userId: entry.userId,
        userName: entry.userName,
        totalSales: entry.saleIds.size,
        earned: entry.earned,
        reversed: entry.reversed,
        net: entry.earned.sub(entry.reversed),
      });
    }

    rows.sort((a, b) => b.net.comparedTo(a.net));

    return rows;
  }
}