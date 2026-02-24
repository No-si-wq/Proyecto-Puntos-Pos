import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import { CreateProductInput, UpdateProductInput, ProductError } from "../types/product";

export class ProductService {
  static async listGlobal() {
    return prisma.product.findMany({
      include: {
        barcodes: {
          select: { code: true },
        },
        category: {
          include: { parent: true }
        },
      },
      orderBy: { name: "asc" },
    });
  }

  static async getByWarehouse(warehouseId: number) {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        price: true,
        cost: true,
        active: true,
        categoryId: true,
        barcodes: {
          select: { code: true },
        },
        category: {
          include: { parent: true }
        }
      },
      orderBy: { name: "asc" },
    });

    const stocks = await prisma.purchaseItem.groupBy({
      by: ["productId"],
      where: { warehouseId },
      _sum: { quantity: true },
    });

    const stockMap = new Map(
      stocks.map(s => [s.productId, s._sum.quantity ?? 0])
    );

    return products.map(p => ({
      ...p,
      stock: stockMap.get(p.id) ?? 0,
    }));
  }

  static async getByBarcode(code: string) {
    return prisma.product.findFirst({
      where: {
        active: true,
        barcodes: {
          some: { code },
        },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        price: true,
        cost: true,
        active: true,
        barcodes: {
          select: { code: true },
        },
        category: {
          include: { parent: true },
        },
      },
    });
  }

  static async getById(id: number) {
    return prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        price: true,
        cost: true, 
        active: true,
        categoryId: true,
        category: {
          include: {
            parent: true,
          },
        },
      },
    });
  }

  static async create(data: CreateProductInput) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.active) {
      throw new Error(ProductError.INVALID_CATEGORY);
    }

    if (data.barcodes?.length) {
      const existing = await prisma.barcode.findFirst({
        where: {
          code: { in: data.barcodes },
        },
      });

      if (existing) {
        throw new Error(
          JSON.stringify({
            type: ProductError.DUPLICATE_BARCODE,
            code: existing.code,
          })
        );
      }
    }
    
    try {
      return prisma.product.create({
        data: {
          sku: data.sku,
          name: data.name,
          description: data.description,
          price: data.price,
          cost: data.cost,
          categoryId: data.categoryId,
          barcodes: data.barcodes?.length
            ? {
              create: data.barcodes.map(code => ({ code }))
              }
            : undefined
        },
        include: {
          barcodes: true,
          category: {
            include: {
              parent: true,
            },
          },
        },
      });      
    } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target as string[])?.includes("code")
    ) {
      throw new Error(ProductError.DUPLICATE_BARCODE);
    }

    throw error;
    }
  }

  static async update(id: number, data: UpdateProductInput) {
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category || !category.active) {
        throw new Error(ProductError.INVALID_CATEGORY);
      }
      const childrenCount = await prisma.category.count({
        where: {
          parentId: data.categoryId,
          active: true,
        },
      });

      if (childrenCount > 0) {
        throw new Error(ProductError.CATEGORY_NOT_LEAF);
      }
    }

    try {
      return prisma.product.update({
        where: { id },
        data: {
          ...data,
          barcodes: data.barcodes
            ? 
              {
                deleteMany: {},
                create: data.barcodes.map(code => ({code})),
              }
            : undefined,
        },
        include: {
          barcodes: true,
          category: {
            include: { parent: true },
          }
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        (error.meta?.target as string[])?.includes("code")
      ) {
        throw new Error(ProductError.DUPLICATE_BARCODE);
      }

      throw error;
    }
  }

  static async toggleActive(id: number, active: boolean) {
    return prisma.product.update({
      where: { id },
      data: { active },
    });
  }
}