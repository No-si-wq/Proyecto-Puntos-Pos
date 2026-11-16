import prisma from "../../core/prisma";
import { Prisma } from "@prisma/client";
import { bankService } from "../bank/bank.service";

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
      where: { ...where, tenantId },
      include: {
        customer: true,
        sale: { select: { id: true, saleNumber: true, createdAt: true } },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: number, tenantId: number) {
    return prisma.accountReceivable.findUnique({
      where: { id, tenantId },
      include: {
        customer: true,
        sale: {
          include: {
            items: {
              include: { product: { select: { name: true, sku: true } } },
            },
          },
        },
        payments: { orderBy: { paymentDate: "desc" } },
      },
    });
  }

async registerPayment(
    tenantId: number,
    accountId: number,
    amount: Prisma.Decimal,
    note?: string,
    bankId?: number,
    userId?: number
  ) {
    return prisma.$transaction(async (tx) => {
      const account = await tx.accountReceivable.findUnique({
        where: { id: accountId, tenantId },
        include: { customer: true }, // <-- agregado
      });

      if (!account) throw new Error("Cuenta no encontrada");
      if (account.balance.lte(0))
        throw new Error("Cuenta ya pagada");

      if (amount.lte(0))
        throw new Error("El monto del pago debe ser mayor a cero");

      if (amount.gt(account.balance))
        throw new Error("El monto del pago no puede ser mayor al saldo pendiente");

      const previousBalance = account.balance; // <-- agregado

      const newBalance = account.balance.minus(amount);
      const newPaid = account.paidAmount.plus(amount);

      let status: any = "PARTIAL";
      if (newBalance.lte(0)) status = "PAID";

      const payment = await tx.receivablePayment.create({
        data: {
          accountId,
          amount,
          note,
          bankId,
        },
      });

      if (bankId) {
        await bankService.registerMovementInTransaction(tx, {
          tenantId,
          bankId,
          type: "DEPOSIT",
          amount,
          description: note ?? `Cobro a cliente - cuenta #${accountId}`,
          referenceType: "RECEIVABLE_PAYMENT",
          referenceId: payment.id,
          createdBy: userId,
        });
      }

      const updated = await tx.accountReceivable.update({
        where: { id: accountId },
        data: {
          balance: newBalance.lte(0) ? new Prisma.Decimal(0) : newBalance,
          paidAmount: newPaid,
          status,
        },
      });

      // <-- cambia el return: antes solo se devolvía "updated"
      return {
        account: updated,
        payment,
        customer: account.customer,
        previousBalance,
        amountPaid: amount,
        currentBalance: updated.balance,
      };
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

  async updatePayment(
    tenantId: number,
    paymentId: number,
    amount: Prisma.Decimal,
    note?: string | null,
    bankId?: number | null,
    userId?: number
  ) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.receivablePayment.findFirst({
        where: { id: paymentId, account: { tenantId } },
        include: { account: { include: { customer: true } } },
      });

      if (!payment) throw new Error("Abono no encontrado");
      if (amount.lte(0))
        throw new Error("El monto del pago debe ser mayor a cero");

      const account = payment.account;
      const delta = amount.minus(payment.amount);
      const newBalance = account.balance.minus(delta);

      if (newBalance.lt(0))
        throw new Error("El nuevo monto excede el saldo pendiente de la cuenta");

      const newPaid = account.paidAmount.plus(delta);

      let status: any = "PARTIAL";
      if (newBalance.lte(0)) status = "PAID";
      else if (newPaid.lte(0)) status = "PENDING";

      const newBankId = bankId ?? null;
      const bankChanged = (payment.bankId ?? null) !== newBankId;

      if (bankChanged || !delta.isZero()) {
        // Reverso del movimiento original
        if (payment.bankId) {
          await bankService.registerMovementInTransaction(tx, {
            tenantId,
            bankId: payment.bankId,
            type: "WITHDRAWAL",
            amount: payment.amount,
            description: `Reverso por edición de abono #${payment.id}`,
            referenceType: "RECEIVABLE_PAYMENT",
            referenceId: payment.id,
            createdBy: userId,
          });
        }
        // Nuevo movimiento
        if (newBankId) {
          await bankService.registerMovementInTransaction(tx, {
            tenantId,
            bankId: newBankId,
            type: "DEPOSIT",
            amount,
            description: note ?? `Cobro a cliente - cuenta #${account.id} (editado)`,
            referenceType: "RECEIVABLE_PAYMENT",
            referenceId: payment.id,
            createdBy: userId,
          });
        }
      }

      const updatedPayment = await tx.receivablePayment.update({
        where: { id: paymentId },
        data: { amount, note: note ?? null, bankId: newBankId },
      });

      const updatedAccount = await tx.accountReceivable.update({
        where: { id: account.id },
        data: { balance: newBalance, paidAmount: newPaid, status },
      });

      return {
        account: updatedAccount,
        payment: updatedPayment,
        customer: account.customer,
        previousBalance: newBalance.plus(amount),
        amountPaid: amount,
        currentBalance: updatedAccount.balance,
      };
    });
  }
}

export const accountReceivableService =
  new AccountReceivableService();