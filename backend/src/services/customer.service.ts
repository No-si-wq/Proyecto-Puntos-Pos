import prisma from "../config/prisma";
import { CreateCustomerInput, UpdateCustomerInput, CustomerError } from "../types/customer";
import { Prisma } from "@prisma/client";
import { DomainError } from "../errors/domain-error";

export class CustomerService {
  static async list() {
    return prisma.customer.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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

  static async getById(id: number) {
    return prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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

  static async create(data: CreateCustomerInput) {
    try {
      return prisma.$transaction(async (tx) => {
        const customer = await tx.customer.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
          },
        });

        await tx.loyaltyPoint.create({
          data: {
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

  static async update(id: number, data: UpdateCustomerInput) {
    try {
      return prisma.customer.update({
        where: { id },
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

  static async toggleActive(id: number, active: boolean) {
    return prisma.customer.update({
      where: { id },
      data: { active },
    });
  }
}