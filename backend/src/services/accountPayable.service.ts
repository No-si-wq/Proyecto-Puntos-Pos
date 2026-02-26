import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

class AccountPayableService {
  async create(data: { purchaseId: number; dueDate?: Date }) {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id: data.purchaseId },
      });

      if (!purchase) throw new Error("Compra no encontrada");

      const existing = await tx.accountPayable.findUnique({
        where: { purchaseId: data.purchaseId },
      });

      if (existing) throw new Error("Ya existe cuenta por pagar");

      return tx.accountPayable.create({
        data: {
          purchaseId: purchase.id,
          supplierId: purchase.supplierId,
          total: purchase.total,
          balance: purchase.total,
          dueDate: data.dueDate,
        },
      });
    });
  }

  async list(filters: any) {
    const where: Prisma.AccountPayableWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.supplierId)
      where.supplierId = Number(filters.supplierId);

    if (filters.overdue === "true") {
      where.dueDate = { lt: new Date() };
      where.status = { not: "PAID" };
    }

    return prisma.accountPayable.findMany({
      where,
      include: {
        supplier: true,
        purchase: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async registerPayment(
    accountId: number,
    amount: Prisma.Decimal,
    note?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const account = await tx.accountPayable.findUnique({
        where: { id: accountId },
      });

      if (!account) throw new Error("Cuenta no encontrada");
      if (account.balance.lte(0))
        throw new Error("Cuenta ya pagada");

      const newBalance = account.balance.minus(amount);
      const newPaid = account.paidAmount.plus(amount);

      let status: any = "PARTIAL";
      if (newBalance.lte(0)) status = "PAID";

      await tx.payablePayment.create({
        data: {
          accountId,
          amount,
          note,
        },
      });

      return tx.accountPayable.update({
        where: { id: accountId },
        data: {
          balance: newBalance.lte(0) ? new Prisma.Decimal(0) : newBalance,
          paidAmount: newPaid,
          status,
        },
      });
    });
  }
}

export const accountPayableService =
  new AccountPayableService();