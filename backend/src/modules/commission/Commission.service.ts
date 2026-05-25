import prisma from "../../core/prisma";
import { Prisma, CommissionType } from "@prisma/client";
import { DomainError } from "../../core/errors/domain-error";
import {
  CreateCommissionLevelDto,
  UpdateCommissionLevelDto,
  AssignCommissionDto,
  UpdateCommissionDto,
  CommissionReportRow,
} from "./Commission";

const userSelect = { id: true, name: true, username: true, tenantId: true };

export class CommissionService {
  async getAllLevels(tenantId: number) {
    return prisma.commissionLevel.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { commissions: true } },
        priceList: { select: { id: true, name: true } },
      },
    });
  }

  async getLevelById(id: number, tenantId: number) {
    const level = await prisma.commissionLevel.findFirst({
      where: { id, tenantId },
      include: {
        priceList: { select: { id: true, name: true } },
        commissions: {
          include: { user: { select: userSelect } },
        },
      },
    });
    if (!level) throw new DomainError("Comision no encontrada");
    return level;
  }

  async createLevel(data: CreateCommissionLevelDto, tenantId: number) {
    const existing = await prisma.commissionLevel.findUnique({
      where: { tenantId_name: { tenantId, name: data.name } },
    });
    if (existing) throw new DomainError("Ya existe una comision con ese nombre");
    return prisma.commissionLevel.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async updateLevel(id: number, data: UpdateCommissionLevelDto, tenantId: number) {
    await this.getLevelById(id, tenantId);
    if (data.name) {
      const existing = await prisma.commissionLevel.findFirst({
        where: { tenantId, name: data.name, NOT: { id } },
      });
      if (existing) throw new DomainError("Ya existe una comision con este nombre");
    }
    return prisma.commissionLevel.update({ where: { id, tenantId }, data });
  }

  async removeLevel(id: number, tenantId: number, active: boolean) {
    await this.getLevelById(id, tenantId);
    const count = await prisma.salesCommission.count({ where: { levelId: id, tenantId } });
    if (count > 0) {
      throw new DomainError(
        "No se puede eliminar un un comision con usuario asignado",
      );
    }
    return prisma.commissionLevel.update({ 
      where: { id, tenantId },
      data: { active },
    });
  }

  async getAllCommissions(tenantId: number) {
    return prisma.salesCommission.findMany({
      where: { tenantId },
      include: {
        user: { select: userSelect },
        level: {
          include: { priceList: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ user: { name: "asc" } }, { level: { name: "asc" } }],
    });
  }

  async getCommissionsByUser(
    userId: number, 
    tenantId: number,
    params?: { from?: Date; to?: Date },
  ) {
  const dateFilter: Prisma.CommissionWhereInput =
    params?.from || params?.to
      ? {
          createdAt: {
            ...(params.from && { gte: params.from }),
            ...(params.to   && { lte: params.to   }),
          },
        }
      : {};

    return prisma.commission.findMany({
      where: { 
        sale: {
          sellerId: userId,
        },
        tenantId,
        ...dateFilter,
      },
      include: {
        sale: {
          select: { id: true, createdAt: true, saleNumber: true, total: true },
        },
        saleItem: {
          select: { id: true, productId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async assignCommission(dto: AssignCommissionDto, tenantId: number) {
    const user = await prisma.user.findFirst({ where: { id: dto.userId, tenantId } });
    if (!user) throw new DomainError("Usuario no encontrado");

    const level = await prisma.commissionLevel.findFirst({ where: { id: dto.levelId, tenantId } });
    if (!level) throw new DomainError("Nivel de Comision no encontrado");

    return prisma.salesCommission.upsert({
      where: {
        tenantId_userId_levelId: {
          tenantId,
          userId: dto.userId,
          levelId: dto.levelId,
        },
      },
      update: { percent: dto.percent },
      create: { tenantId, userId: dto.userId, levelId: dto.levelId, percent: dto.percent },
      include: {
        user: { select: userSelect },
        level: true,
      },
    });
  }

  async updateCommission(id: number, dto: UpdateCommissionDto, tenantId: number) {
    const commission = await prisma.salesCommission.findFirst({ where: { id, tenantId } });
    if (!commission) throw new DomainError("No fue encontrada la comision");
    return prisma.salesCommission.update({
      where: { id, tenantId },
      data: { percent: dto.percent },
      include: { user: { select: userSelect }, level: true },
    });
  }

  async removeCommission(id: number, tenantId: number, active: boolean) {
    const commission = await prisma.salesCommission.findFirst({ where: { id, tenantId } });
    if (!commission) throw new DomainError("No fue encontrada la comision");
    return prisma.salesCommission.update({ 
      where: { id, tenantId },
      data: { active }
    });
  }

  async resolveCommissionPercent(userId: number, levelName: string, tenantId: number): Promise<number | null> {
    const commission = await prisma.salesCommission.findFirst({
      where: {
        userId,
        level: { name: levelName },
        tenantId,
      },
    });
    return commission ? Number(commission.percent) : null;
  }

  async getSummary(
    tenantId: number,
    params?: {
    from?: Date;
    to?: Date;
  }): Promise<CommissionReportRow[]> {
    const dateFilter =
      params?.from && params?.to
        ? { createdAt: { gte: params.from, lte: params.to }, tenantId }
        : {tenantId};

    const commissions = await prisma.commission.findMany({
      where: dateFilter,
      select: {
        userId: true,
        type: true,
        amount: true,
        saleId: true,
        user: { select: { name: true } },
        sale: {
          select: {
            sellerId: true,
            seller: { select: { name: true } },
            total: true,
          },
        },
      },
    });

    const map = new Map<number, {
      sellerId: number;
      sellerName: string;
      saleIds: Set<number>;
      earned: Prisma.Decimal;
      reversed: Prisma.Decimal;
      sellerSalesAmount: Prisma.Decimal;
    }>();

    for (const c of commissions) {
      if (!c.sale.sellerId) continue; // omite comisiones sin vendedor asignado

      const sellerId = c.sale.sellerId;
      const sellerName = c.sale.seller?.name ?? `Vendedor ${sellerId}`;

      if (!map.has(sellerId)) {
        map.set(sellerId, {
          sellerId,
          sellerName,
          saleIds: new Set(),
          earned: new Prisma.Decimal(0),
          reversed: new Prisma.Decimal(0),
          sellerSalesAmount: new Prisma.Decimal(0),
        });
      }

      const entry = map.get(sellerId)!;

      if (!entry.saleIds.has(c.saleId)) {
        entry.sellerSalesAmount = entry.sellerSalesAmount.add(c.sale.total);
      }
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
        userId: entry.sellerId,       // ← reutiliza el campo userId para la navegación
        userName: entry.sellerName,   // ← nombre del vendedor
        totalSales: entry.saleIds.size,
        earned: entry.earned,
        reversed: entry.reversed,
        net: entry.earned.sub(entry.reversed),
        sellers: [entry.sellerName],
        sellerCount: 1,
        sellerSalesAmount: entry.sellerSalesAmount,
      });
    }

    rows.sort((a, b) => b.net.comparedTo(a.net));

    return rows;
  }
}

export const commissionService = new CommissionService();
