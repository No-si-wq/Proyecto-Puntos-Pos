import prisma from "../../core/prisma";
import { Prisma } from "@prisma/client";
import { CreateProductInput, UpdateProductInput, ProductError } from "./product";

const pricesInclude = {
  prices: {
    include: {
      priceList: { select: { id: true, name: true, active: true } },
    },
  },
} as const;

const categoryInclude = {
  category: { include: { parent: true } },
} as const;

const baseSelect = {
  id: true,
  sku: true,
  name: true,
  description: true,
  price: true,
  cost: true,
  tax: true,
  active: true,
  categoryId: true,
  barcodes: { select: { code: true } },
  ...pricesInclude,
  ...categoryInclude,
} as const;

function rethrowBarcodeError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (error.meta?.target as string[])?.includes("code")
  ) {
    throw new Error(ProductError.DUPLICATE_BARCODE);
  }
  throw error;
}

export class ProductService {
  static async listGlobal(params: { 
    search?: string;
   }) {
    const { search } = params;
    const products = await prisma.product.findMany({
      where: { 
        active: true,
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              sku: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        })
       },
      include: { barcodes: { select: { code: true } }, ...pricesInclude },
      orderBy: { name: "asc" },
    });

    return products.map(p => ({
      ...p,
      barcodes: p.barcodes.map(b => b.code),
    }));
  }

  static async getByWarehouse(warehouseId: number) {
    const [products, stocks] = await Promise.all([
      prisma.product.findMany({
        where: { active: true },
        select: baseSelect,
        orderBy: { name: "asc" },
      }),
      prisma.purchaseItem.groupBy({
        by: ["productId"],
        where: { warehouseId },
        _sum: { quantity: true },
      }),
    ]);

    const stockMap = new Map(stocks.map((s) => [s.productId, s._sum.quantity ?? 0]));
    return products.map((p) => ({ ...p, stock: stockMap.get(p.id) ?? 0 }));
  }

  static async getByBarcode(code: string) {
    return prisma.product.findFirst({
      where: { active: true, barcodes: { some: { code } } },
      select: baseSelect,
    });
  }

  static async getById(id: number) {
    const product = await prisma.product.findUnique({ where: { id }, select: baseSelect });
    if (!product) return null;

    return {
      ...product,
      barcodes: product.barcodes.map(b => b.code),
    };
  }

  static async getPrices(id: number) {
    return prisma.productPrice.findMany({
      where: { productId: id },
      include: { priceList: { select: { id: true, name: true, active: true } } },
    });
  }

  static async create(data: CreateProductInput) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category?.active) throw new Error(ProductError.INVALID_CATEGORY);

    if (data.barcodes?.length) {
      const dup = await prisma.barcode.findFirst({ where: { code: { in: data.barcodes } } });
      if (dup) throw new Error(JSON.stringify({ type: ProductError.DUPLICATE_BARCODE, code: dup.code }));
    }

    if (data.prices?.length) {
      await ProductService._validatePriceLists(data.prices.map((p) => p.priceListId));
    }

    try {
      return await prisma.product.create({
        data: {
          sku: data.sku,
          name: data.name,
          description: data.description,
          price: data.price,
          cost: data.cost,
          categoryId: data.categoryId,
          barcodes: data.barcodes?.length
            ? { create: data.barcodes.map((code) => ({ code })) }
            : undefined,
          prices: data.prices?.length
            ? { create: data.prices.map(({ priceListId, price }) => ({ priceListId, price })) }
            : undefined,
        },
        include: { barcodes: true, ...pricesInclude, ...categoryInclude },
      });
    } catch (e) { rethrowBarcodeError(e); }
  }

  static async update(id: number, data: UpdateProductInput) {
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId, active: true },
      });
      if (!category?.active) throw new Error(ProductError.INVALID_CATEGORY);

      const children = await prisma.category.count({
        where: { parentId: data.categoryId, active: true },
      });
      if (children > 0) throw new Error(ProductError.CATEGORY_NOT_LEAF);
    }

    if (data.prices?.length) {
      await ProductService._validatePriceLists(data.prices.map((p) => p.priceListId));
    }

    const { prices, barcodes, ...productFields } = data;

    try {
      return await prisma.$transaction(async (tx) => {
        if (prices !== undefined) {
          if (prices.length === 0) {
            await tx.productPrice.deleteMany({ where: { productId: id } });
          } else {
            await Promise.all(
              prices.map(({ priceListId, price }) =>
                tx.productPrice.upsert({
                  where: { productId_priceListId: { productId: id, priceListId } },
                  update: { price },
                  create: { productId: id, priceListId, price },
                })
              )
            );
          }
        }

        return tx.product.update({
          where: { id },
          data: {
            ...productFields,
            barcodes: barcodes
              ? { deleteMany: {}, create: barcodes.map((code) => ({ code })) }
              : undefined,
          },
          include: { barcodes: true, ...pricesInclude, ...categoryInclude },
        });
      });
    } catch (e) { rethrowBarcodeError(e); }
  }

  static async toggleActive(id: number, active: boolean) {
    return prisma.product.update({ where: { id }, data: { active } });
  }

  static async setReorderPoint(
    id: number,
    reorderPoint: number
  ) {
    if (reorderPoint < 0) {
      throw new Error("El punto de reorden no puede ser negativo");
    }
 
    return prisma.product.update({
      where: { id },
      data: { reorderPoint },
      select: { id: true, name: true, reorderPoint: true },
    });
  }

  private static async _validatePriceLists(priceListIds: number[]) {
    const found = await prisma.priceList.findMany({
      where: { id: { in: priceListIds }, active: true },
      select: { id: true },
    });

    if (found.length !== priceListIds.length) {
      const foundIds = new Set(found.map((p) => p.id));
      const missing = priceListIds.find((id) => !foundIds.has(id));
      throw new Error(
        JSON.stringify({ type: ProductError.INVALID_PRICE_LIST, priceListId: missing })
      );
    }
  }
  static async upsertPrice(productId: number, dto: { priceListId: number; price: number }) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");

    await ProductService._validatePriceLists([dto.priceListId]);

    return prisma.productPrice.upsert({
      where: { productId_priceListId: { productId, priceListId: dto.priceListId } },
      update: { price: dto.price },
      create: { productId, priceListId: dto.priceListId, price: dto.price },
      include: {
        priceList: { select: { id: true, name: true, active: true } },
      },
    });
  }

  static async removePrice(productId: number, priceListId: number) {
    const record = await prisma.productPrice.findUnique({
      where: { productId_priceListId: { productId, priceListId } },
    });
    if (!record || !record.active) throw new Error("Price not found");
    return prisma.productPrice.update({
      where: { productId_priceListId: { productId, priceListId } },
      data: { active: false },
    });
  }
}