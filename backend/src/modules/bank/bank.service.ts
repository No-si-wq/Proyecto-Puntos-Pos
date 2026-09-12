import prisma from "../../core/prisma";
import { Prisma, BankTransactionType } from "@prisma/client";
import { BankStatement } from "./bank";

type TxClient = Prisma.TransactionClient;

class BankService {
  async create(data: {
    tenantId: number;
    name: string;
    bankName?: string;
    accountNumber?: string;
    accountType?: string;
    currency?: string;
  }) {
    const existing = await prisma.bank.findUnique({
      where: { tenantId_name: { tenantId: data.tenantId, name: data.name } },
    });

    if (existing) throw new Error("Ya existe un banco con ese nombre");

    return prisma.bank.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        currency: data.currency ?? "HNL",
        balance: new Prisma.Decimal(0),
      },
    });
  }

  async list(filters: any, tenantId: number) {
    const where: Prisma.BankWhereInput = { tenantId };

    if (filters.active !== undefined) {
      where.active = filters.active === "true";
    }

    return prisma.bank.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async findById(id: number, tenantId: number) {
    const bank = await prisma.bank.findUnique({
      where: { id, tenantId },
    });

    if (!bank) throw new Error("Banco no encontrado");

    return bank;
  }

  async update(
    id: number,
    tenantId: number,
    data: Partial<{
      name: string;
      bankName: string;
      accountNumber: string;
      accountType: string;
      currency: string;
      active: boolean;
    }>
  ) {
    await this.findById(id, tenantId);

    return prisma.bank.update({
      where: { id },
      data,
    });
  }

  private assertDifferentBanks(fromBankId: number, toBankId: number) {
    if (fromBankId === toBankId) {
      throw new Error(
        "El banco de origen y destino no pueden ser el mismo"
      );
    }
  }

  private async registerMovement(
    tx: TxClient,
    params: {
      tenantId: number;
      bankId: number;
      type: BankTransactionType;
      amount: Prisma.Decimal;
      description?: string;
      referenceType?: string;
      referenceId?: number;
      transferGroupId?: number;
      createdBy?: number;
    }
  ) {
    const bank = await tx.bank.findUnique({
      where: { id: params.bankId, tenantId: params.tenantId },
    });

    if (!bank) throw new Error("Banco no encontrado");
    if (!bank.active) throw new Error("El banco está inactivo");

    const isOutflow =
      params.type === "WITHDRAWAL" || params.type === "TRANSFER_OUT";

    if (isOutflow && bank.balance.lt(params.amount)) {
      throw new Error("Saldo insuficiente en la cuenta bancaria");
    }

    const newBalance = isOutflow
      ? bank.balance.minus(params.amount)
      : bank.balance.plus(params.amount);

    const transaction = await tx.bankTransaction.create({
      data: {
        tenantId: params.tenantId,
        bankId: params.bankId,
        type: params.type,
        amount: params.amount,
        description: params.description,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        transferGroupId: params.transferGroupId,
        createdBy: params.createdBy,
      },
    });

    await tx.bank.update({
      where: { id: params.bankId },
      data: { balance: newBalance },
    });

    return transaction;
  }

  async createMovement(
    tenantId: number,
    bankId: number,
    data: {
      type: "DEPOSIT" | "WITHDRAWAL";
      amount: Prisma.Decimal;
      description?: string;
    },
    userId?: number
  ) {
    return prisma.$transaction(async (tx) => {
      return this.registerMovement(tx, {
        tenantId,
        bankId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        referenceType: "MANUAL",
        createdBy: userId,
      });
    });
  }

  /**
   * Método reutilizable para otros módulos (ej. accountReceivable.service.ts /
   * accountPayable.service.ts) que necesiten registrar un movimiento bancario
   * dentro de su propia transacción de Prisma al cobrar o pagar contra un banco.
   */
  async registerMovementInTransaction(
    tx: TxClient,
    params: {
      tenantId: number;
      bankId: number;
      type: BankTransactionType;
      amount: Prisma.Decimal;
      description?: string;
      referenceType?: string;
      referenceId?: number;
      createdBy?: number;
    }
  ) {
    return this.registerMovement(tx, params);
  }

  async transfer(
    tenantId: number,
    data: {
      fromBankId: number;
      toBankId: number;
      amount: Prisma.Decimal;
      description?: string;
    },
    userId?: number
  ) {
    this.assertDifferentBanks(data.fromBankId, data.toBankId);

    return prisma.$transaction(async (tx) => {
      const outMovement = await this.registerMovement(tx, {
        tenantId,
        bankId: data.fromBankId,
        type: "TRANSFER_OUT",
        amount: data.amount,
        description: data.description,
        referenceType: "TRANSFER",
        createdBy: userId,
      });

      const inMovement = await this.registerMovement(tx, {
        tenantId,
        bankId: data.toBankId,
        type: "TRANSFER_IN",
        amount: data.amount,
        description: data.description,
        referenceType: "TRANSFER",
        transferGroupId: outMovement.id,
        createdBy: userId,
      });

      await tx.bankTransaction.update({
        where: { id: outMovement.id },
        data: { transferGroupId: outMovement.id },
      });

      return { outMovement, inMovement };
    });
  }

  async listTransactions(tenantId: number, filters: any) {
    const where: Prisma.BankTransactionWhereInput = { tenantId };

    if (filters.bankId) where.bankId = Number(filters.bankId);
    if (filters.type) where.type = filters.type;
    if (filters.reconciled !== undefined) {
      where.reconciled = filters.reconciled === "true";
    }
    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }

    return prisma.bankTransaction.findMany({
      where,
      include: { bank: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async reconcile(tenantId: number, transactionIds: number[]) {
    return prisma.$transaction(async (tx) => {
      const transactions = await tx.bankTransaction.findMany({
        where: { id: { in: transactionIds }, tenantId },
      });

      if (transactions.length !== transactionIds.length) {
        throw new Error("Alguno de los movimientos no existe");
      }

      await tx.bankTransaction.updateMany({
        where: { id: { in: transactionIds }, tenantId },
        data: { reconciled: true, reconciledAt: new Date() },
      });

      return tx.bankTransaction.findMany({
        where: { id: { in: transactionIds } },
      });
    });
  }

  async summary(tenantId: number) {
    const banks = await prisma.bank.findMany({
      where: { tenantId, active: true },
    });

    const totalBalance = banks.reduce(
      (acc, b) => acc.plus(b.balance),
      new Prisma.Decimal(0)
    );

    return { totalBalance, banks };
  }

  async getBankStatement(
    tenantId: number,
    bankId: number,
    from: Date,
    to: Date
  ): Promise<BankStatement> {
    const bank = await prisma.bank.findFirst({
      where: { id: bankId, tenantId },
    });

    if (!bank) {
      throw new Error("Banco no encontrado");
    }

    const priorMovements = await prisma.bankTransaction.findMany({
      where: { tenantId, bankId, createdAt: { lt: from } },
      select: { type: true, amount: true },
    });

    const isCredit = (type: string) =>
      type === "DEPOSIT" || type === "TRANSFER_IN";

    const initialBalance = priorMovements.reduce((acc, m) => {
      const credit = isCredit(m.type);
      return acc + (credit ? Number(m.amount) : -Number(m.amount));
    }, 0);

    const movements = await prisma.bankTransaction.findMany({
      where: { tenantId, bankId, createdAt: { gte: from, lt: to } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    const codeMap: Record<string, string> = {
      DEPOSIT: "DEP",
      WITHDRAWAL: "RET",
      TRANSFER_IN: "TFE",
      TRANSFER_OUT: "TFS",
    };

    let running = initialBalance;
    const rows = movements.map((m) => {
      const credit = isCredit(m.type);
      const debit = credit ? 0 : Number(m.amount);
      const creditAmount = credit ? Number(m.amount) : 0;
      running += creditAmount - debit;

      return {
        id: m.id,
        date: m.createdAt,
        reference: m.referenceId ?? null,
        code: codeMap[m.type] ?? m.type,
        description: m.description ?? "",
        debit,
        credit: creditAmount,
        balance: running,
      };
    });

    return {
      bank: {
        id: bank.id,
        name: bank.name,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        currency: bank.currency,
      },
      initialBalance,
      finalBalance: running,
      currentBalance: Number(bank.balance),
      rows,
    };
  }
}

export const bankService = new BankService();