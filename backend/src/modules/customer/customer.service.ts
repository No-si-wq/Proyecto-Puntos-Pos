import prisma from "../../core/prisma";
import { CreateCustomerInput, UpdateCustomerInput, CustomerError } from "./customer";
import { Prisma } from "@prisma/client";
import { DomainError } from "../../core/errors/domain-error";

export class CustomerService {
  static async list(tenantId: number) {
    return prisma.customer.findMany({
      where: { active: true, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        dni: true,
        phone: true,
        direction: true,
        active: true,
        createdAt: true,
        points: {
          select: {
            balance: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: number, tenantId: number) {
    return prisma.customer.findUnique({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dni: true,
        direction: true,
        active: true,
        createdAt: true,
        points: {
          select: {
            balance: true,
          },
        },
      },
    });
  }

  static async create(data: CreateCustomerInput, tenantId: number) {
    try {
      return prisma.$transaction(async (tx) => {
        const customer = await tx.customer.create({
          data: {
            ...data,
            tenantId,
          },
        });

        await tx.loyaltyPoint.create({
          data: {
            tenantId,
            customerId: customer.id,
            balance: 0,
          },
        });

        return customer;
      }); 
    } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new DomainError(CustomerError.DUPLICATE_CUSTOMER);
        }

        throw error;
      }
  }

  static async update(id: number, tenantId: number, data: UpdateCustomerInput) {
    try {
      return prisma.customer.update({
        where: { id, tenantId },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new DomainError(CustomerError.DUPLICATE_CUSTOMER);
      }

      throw error;
    }
  }

  static async toggleActive(id: number, tenantId: number, active: boolean) {
    return prisma.customer.update({
      where: { id, tenantId },
      data: { active },
    });
  }
}