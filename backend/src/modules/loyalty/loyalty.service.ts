import { Prisma } from "@prisma/client";
import { LoyaltyError } from "../../types/points";
import { LOYALTY_CONFIG } from "./loyalty.rules";

type Tx = Prisma.TransactionClient;

export class LoyaltyService {
  static async usePoints(
    tx: Tx,
    customerId: number,
    pointsRequested: number
  ): Promise<number> {
    if (!LOYALTY_CONFIG.redeem.enabled || pointsRequested <= 0) {
      return 0;
    }

    const loyalty = await tx.loyaltyPoint.findUnique({
      where: { customerId },
    });

    if (!loyalty || loyalty.balance < pointsRequested) {
      throw new Error(LoyaltyError.INSUFFICIENT_POINTS);
    }

    const usablePoints = Math.min(pointsRequested, loyalty.balance);
    const discount = usablePoints * LOYALTY_CONFIG.redeem.pointValue;

    await tx.loyaltyPoint.update({
      where: { customerId },
      data: { balance: { decrement: usablePoints } },
    });

    await tx.loyaltyPointHistory.create({
      data: {
        customerId,
        change: -usablePoints,
        description: "Uso de puntos",
      },
    });

    return discount;
  }

  static async earnPoints(
    tx: Tx,
    customerId: number,
    total: number,
    saleId: number
  ): Promise<number> {
    if (!LOYALTY_CONFIG.earn.enabled) return 0;

    const points = Math.floor(
      total / LOYALTY_CONFIG.earn.amountPerPoint
    );

    if (points <= 0) return 0;

    await tx.loyaltyPoint.update({
      where: { customerId },
      data: { balance: { increment: points } },
    });

    await tx.loyaltyPointHistory.create({
      data: {
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
    customerId: number,
    saleId: number
  ) {
    const history = await tx.loyaltyPointHistory.findMany({
      where: { saleId },
    });

    for (const record of history) {
      await tx.loyaltyPoint.update({
        where: { customerId },
        data: {
          balance: { decrement: record.change },
        },
      });
    }

    await tx.loyaltyPointHistory.deleteMany({
      where: { saleId },
    });
  }
}