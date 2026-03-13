import prisma from "../../core/prisma";
import { DomainError } from "../../core/errors/domain-error";
import {
  CreateCommissionLevelDto,
  UpdateCommissionLevelDto,
  AssignCommissionDto,
  UpdateCommissionDto,
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
    if (!user) throw new DomainError("User not found");

    const level = await prisma.commissionLevel.findUnique({ where: { id: dto.levelId } });
    if (!level) throw new DomainError("Commission level not found");

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
}

export const commissionService = new CommissionService();