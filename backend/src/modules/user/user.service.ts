import prisma from "../../core/prisma";
import { Role } from "../user/roles";
import { hashPassword } from "../../core/utils/password";

interface CreateUserInput {
  name: string;
  warehouseId: number;
  username: string;
  password: string;
  role: Role;
}

interface UpdateUserInput {
  name?: string;
  role?: Role;
  warehouseId?: number;
  username?: string;
  active?: boolean;
}

export class UserService {
  static async list(tenantId: number) {
    return prisma.user.findMany({
      where: { active: true, tenantId },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: number, tenantId: number) {
    return prisma.user.findUnique({
      where: { id, tenantId },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async create(data: CreateUserInput, tenantId: number) {
    const hashedPassword = await hashPassword(data.password);

    return prisma.user.create({
      data: {
        tenantId,
        username: data.username,
        name: data.name,
        warehouseId: data.warehouseId,
        password: hashedPassword,
        role: data.role,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        warehouseId: true,
        active: true,
      },
    });
  }

  static async update(id: number, data: UpdateUserInput, tenantId: number) {
    return prisma.user.update({
      where: { id, tenantId },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        warehouseId: true,
        active: true,
      },
    });
  }

  static async toggleActive(id: number, tenantId: number, active: boolean) {
    return prisma.user.update({
      where: { id, tenantId },
      data: {
        active,
        tokenVersionAt: new Date(),
      },
    });
  }

  static async forceLogoutAll(id: number, tenantId: number) {
    await prisma.user.update({
      where: { id, tenantId },
      data: {
        tokenVersionAt: new Date(),
      },
    });

    await prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { revoked: true },
    });
  }
}