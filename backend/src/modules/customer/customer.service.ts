import prisma from "../../core/prisma";
import { CreateCustomerInput, UpdateCustomerInput, CustomerError } from "./customer";
import { Prisma } from "@prisma/client";
import { DomainError } from "../../core/errors/domain-error";

export class CustomerService {
  static async list(
    params: { search?: string }
  ) {
    
    const { search } = params;

    return prisma.customer.findMany({
      where: { 
        active: true,
        ...(search && {
          OR: [
            {
              dni: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }),
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
            dni: data.dni,
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