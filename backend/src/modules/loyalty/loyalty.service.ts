import { Prisma } from "@prisma/client";
import { LoyaltyError } from "./points";
import { getLoyaltyConfig } from "./loyalty.rules";

type Tx = Prisma.TransactionClient;

export class LoyaltyService {
  static async usePoints(
    tx: Tx,
    tenantId: number,
    customerId: number,
    saleId: number,
    pointsRequested: number,
  ): Promise<number> {
    const config = await getLoyaltyConfig(tenantId);

    if (!config.redeem.enabled || pointsRequested <= 0) {
      return 0;
    }

    const loyalty = await tx.loyaltyPoint.findUnique({
      where: { customerId },
    });

    if (!loyalty) {
      throw new Error(LoyaltyError.ACCOUNT_NOT_FOUND);
    }

    const usablePoints = Math.min(pointsRequested, loyalty.balance);
    if (usablePoints === 0) {
      return 0;
    }
    const discount = usablePoints * config.redeem.pointValue;

    await tx.loyaltyPoint.update({
      where: { customerId },
      data: { balance: { decrement: usablePoints } },
    });

    await tx.loyaltyPointHistory.create({
      data: {
        tenantId,
        customerId,
        saleId,
        change: -usablePoints,
        description: "Uso de puntos",
      },
    });

    return discount;
  }

  static async earnPoints(
    tx: Tx,
    tenantId: number,
    customerId: number,
    total: number,
    saleId: number
  ): Promise<number> {
     const config = await getLoyaltyConfig(tenantId);

    if (!config.earn.enabled) return 0;

    const points = Math.floor(total / config.earn.amountPerPoint);

    if (points <= 0) return 0;

    await tx.loyaltyPoint.update({
      where: { customerId },
      data: { balance: { increment: points } },
    });

    await tx.loyaltyPointHistory.create({
      data: {
        tenantId,
        customerId,
        saleId,
        change: points,
        description: "Puntos ganados por venta",
      },
    });

    return points;
  }

  static async rollbackPoints(
    tx: Tx,
    tenantId: number,
    customerId: number,
    saleId: number
  ) {
    const history = await tx.loyaltyPointHistory.findMany({
      where: { saleId },
    });

    if (!history.length) return;

    let adjustment = 0;

    for (const record of history) {
      const reverse = -record.change;

      adjustment += reverse;

      await tx.loyaltyPointHistory.create({
        data: {
          tenantId,
          customerId,
          saleId,
          change: reverse,
          description: "Reversión por cancelación de venta",
        },
      });
    }

    await tx.loyaltyPoint.update({
      where: { customerId },
      data: {
        balance: {
          increment: adjustment,
        },
      },
    });
  }
}