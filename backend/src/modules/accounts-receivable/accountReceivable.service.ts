import prisma from "../../core/prisma";
import { Prisma } from "@prisma/client";

class AccountReceivableService {
  async create(data: { saleId: number; dueDate?: Date, tenantId: number }) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: data.saleId, tenantId: data.tenantId },
      });

      if (!sale) throw new Error("Venta no encontrada");
      if (!sale.customerId)
        throw new Error("La venta no tiene cliente asociado");

      const existing = await tx.accountReceivable.findUnique({
        where: { saleId: data.saleId },
      });

      if (existing) throw new Error("Ya existe cuenta por cobrar");

      return tx.accountReceivable.create({
        data: {
          saleId: sale.id,
          customerId: sale.customerId,
          total: sale.total,
          balance: sale.total,
          dueDate: data.dueDate,
          tenantId: data.tenantId,
        },
      });
    });
  }

  async list(filters: any, tenantId: number) {
    const where: Prisma.AccountReceivableWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.customerId)
      where.customerId = Number(filters.customerId);

    if (filters.overdue === "true") {
      where.dueDate = { lt: new Date() };
      where.status = { not: "PAID" };
    }

    return prisma.accountReceivable.findMany({
      where: { tenantId },
      include: {
        customer: true,
        sale: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: number, tenantId: number) {
    return prisma.accountReceivable.findUnique({
      where: { id, tenantId },
      include: {
        customer: true,
        sale: true,
        payments: true,
      },
    });
  }

  async registerPayment(
    tenantId: number,
    accountId: number,
    amount: Prisma.Decimal,
    note?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const account = await tx.accountReceivable.findUnique({
        where: { id: accountId, tenantId },
      });

      if (!account) throw new Error("Cuenta no encontrada");
      if (account.balance.lte(0))
        throw new Error("Cuenta ya pagada");

      const newBalance = account.balance.minus(amount);
      const newPaid = account.paidAmount.plus(amount);

      let status: any = "PARTIAL";
      if (newBalance.lte(0)) status = "PAID";

      await tx.receivablePayment.create({
        data: {
          accountId,
          amount,
          note,
        },
      });

      return tx.accountReceivable.update({
        where: { id: accountId },
        data: {
          balance: newBalance.lte(0) ? new Prisma.Decimal(0) : newBalance,
          paidAmount: newPaid,
          status,
        },
      });
    });
  }

  async summaryByCustomer(customerId: number, tenantId: number) {
    const accounts = await prisma.accountReceivable.findMany({
      where: { customerId, tenantId },
    });

    const totalDebt = accounts.reduce(
      (acc, a) => acc.plus(a.total),
      new Prisma.Decimal(0)
    );

    const totalPaid = accounts.reduce(
      (acc, a) => acc.plus(a.paidAmount),
      new Prisma.Decimal(0)
    );

    const openAccounts = accounts.filter(
      (a) => a.status !== "PAID"
    ).length;

    return { totalDebt, totalPaid, openAccounts };
  }
}

export const accountReceivableService =
  new AccountReceivableService();