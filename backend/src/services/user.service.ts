import prisma from "../config/prisma";
import { Role } from "../types/roles";
import { hashPassword } from "../utils/password";

interface CreateUserInput {
  email: string;
  name: string;
  username: string;
  password: string;
  role: Role;
}

interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: Role;
  username?: string;
  active?: boolean;
}

export class UserService {
  static async list() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        username: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  static async create(data: CreateUserInput) {
    const hashedPassword = await hashPassword(data.password);

    return prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        name: data.name,
        password: hashedPassword,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        active: true,
      },
    });
  }

  static async update(id: number, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        active: true,
      },
    });
  }

  static async toggleActive(id: number, active: boolean) {
    return prisma.user.update({
      where: { id },
      data: {
        active,
        tokenVersionAt: new Date(),
      },
    });
  }

  static async forceLogoutAll(id: number) {
    await prisma.user.update({
      where: { id },
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