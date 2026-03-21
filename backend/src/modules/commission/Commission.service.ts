import prisma from "../../core/prisma";
import { Prisma, CommissionType } from "@prisma/client";
import { DomainError } from "../../core/errors/domain-error";
import {
  CreateCommissionLevelDto,
  UpdateCommissionLevelDto,
  AssignCommissionDto,
  UpdateCommissionDto,
  CommissionReportRow
} from "./Commission";

const userSelect = { id: true, name: true, username: true };

export class CommissionService {
  async getAllLevels() {
    return prisma.commissionLevel.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { commissions: true } },
        priceList: { select: { id: true, name: true } },
      },
    });
  }

  async getLevelById(id: number) {
    const level = await prisma.commissionLevel.findUnique({
      where: { id },
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

  async createLevel(data: CreateCommissionLevelDto) {
    const existing = await prisma.commissionLevel.findUnique({ where: { name: data.name } });
    if (existing) throw new DomainError("Ya existe una comision con ese nombre");
    return prisma.commissionLevel.create({data});
  }

  async updateLevel(id: number, data: UpdateCommissionLevelDto) {
    await this.getLevelById(id);
    if (data.name) {
      const existing = await prisma.commissionLevel.findFirst({
        where: { name: data.name, NOT: { id } },
      });
      if (existing) throw new DomainError("Ya existe una comision con este nombre");
    }
    return prisma.commissionLevel.update({ where: { id }, data });
  }

  async removeLevel(id: number, active: boolean) {
    await this.getLevelById(id);
    const count = await prisma.salesCommission.count({ where: { levelId: id } });
    if (count > 0) {
      throw new DomainError(
        "No se puede eliminar un un comision con usuario asignado",
      );
    }
    return prisma.commissionLevel.update({ 
      where: { id },
      data: { active },
    });
  }

  async getAllCommissions() {
    return prisma.salesCommission.findMany({
      include: {
        user: { select: userSelect },
        level: {
          include: { priceList: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ user: { name: "asc" } }, { level: { name: "asc" } }],
    });
  }

  async getCommissionsByUser(userId: number) {
    return prisma.salesCommission.findMany({
      where: { userId },
      include: { level: true },
    });
  }

  async assignCommission(dto: AssignCommissionDto) {
    const user = await prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new DomainError("Usuario no encontrado");

    const level = await prisma.commissionLevel.findUnique({ where: { id: dto.levelId } });
    if (!level) throw new DomainError("Nivel de Comision no encontrada");

    return prisma.salesCommission.upsert({
      where: {
        userId_levelId: { userId: dto.userId, levelId: dto.levelId },
      },
      update: { percent: dto.percent },
      create: { userId: dto.userId, levelId: dto.levelId, percent: dto.percent },
      include: {
        user: { select: userSelect },
        level: true,
      },
    });
  }

  async updateCommission(id: number, dto: UpdateCommissionDto) {
    const commission = await prisma.salesCommission.findUnique({ where: { id } });
    if (!commission) throw new DomainError("Commission assignment not found");
    return prisma.salesCommission.update({
      where: { id },
      data: { percent: dto.percent },
      include: { user: { select: userSelect }, level: true },
    });
  }

  async removeCommission(id: number, active: boolean) {
    const commission = await prisma.salesCommission.findUnique({ where: { id } });
    if (!commission) throw new DomainError("Commission assignment not found");
    return prisma.salesCommission.update({ 
      where: { id },
      data: { active }
    });
  }

  async resolveCommissionPercent(userId: number, levelName: string): Promise<number | null> {
    const commission = await prisma.salesCommission.findFirst({
      where: {
        userId,
        level: { name: levelName },
      },
    });
    return commission ? Number(commission.percent) : null;
  }
  
  async getSummary(params?: {
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

export const commissionService = new CommissionService();