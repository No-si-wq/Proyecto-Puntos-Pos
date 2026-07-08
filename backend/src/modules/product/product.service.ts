import { promises as fs } from "fs";
import path from "path";
import prisma from "../../core/prisma";
import { Prisma } from "@prisma/client";
import { CreateProductInput, UpdateProductInput, ProductError } from "./product";

const pricesInclude = {
  prices: {
    where: { active: true },
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
  observations: true,
  laboratory: true,
  imageUrl: true,
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

function deleteProductImageFile(imageUrl: string | null | undefined) {
  if (!imageUrl) return;
  // imageUrl guarda algo como "/uploads/products/169999-123.jpg"
  const relativePath = imageUrl.replace(/^\/+/, ""); // quita el "/" inicial
  const absolutePath = path.join(process.cwd(), relativePath);
  fs.unlink(absolutePath).catch(() => {
    // Si el archivo ya no existe o falla el borrado, no se interrumpe la actualización
  });
}

export class ProductService {
  static async listGlobal(params: {
    tenantId: number;
    search?: string;
    onlyInactive?: boolean
  }) {
    const { tenantId, search, onlyInactive } = params;

    // Normalizar search
    const normalizedSearch = search?.trim() || undefined;

    const products = await prisma.product.findMany({
      where: {
        active: onlyInactive ? false : true,
        tenantId,
        ...(normalizedSearch && {
          OR: [
            {
              name: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
            {
              sku: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
            {
              barcodes: {
                some: {
                  code: {
                    contains: normalizedSearch,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }),
      },
      include: { barcodes: { select: { code: true } }, ...pricesInclude },
      orderBy: { name: "asc" },
      // Agregar take si hay riesgo de timeout con muchos registros
      // take: 500,
    });

    return products.map(p => ({
      ...p,
      barcodes: p.barcodes.map(b => b.code),
    }));
  }

  static async getByWarehouse(warehouseId: number, tenantId: number) {
    const [products, stocks] = await Promise.all([
      prisma.product.findMany({
        where: { active: true, tenantId },
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

  static async getById(id: number, tenantId: number) {
    const product = await prisma.product.findUnique({ where: { id, tenantId }, select: baseSelect });
    if (!product) return null;

    return {
      ...product,
      barcodes: product.barcodes.map(b => b.code),
    };
  }

  static async getPrices(id: number, tenantId: number) {
    return prisma.productPrice.findMany({
      where: { productId: id, tenantId, active: true },
      include: { priceList: { select: { id: true, name: true, active: true } } },
    });
  }

  static async create(data: CreateProductInput, tenantId: number) {
    const category = await prisma.category.findUnique({ 
      where: { id: data.categoryId, tenantId } 
    });
    if (!category?.active) throw new Error(ProductError.INVALID_CATEGORY);

    if (data.barcodes?.length) {
      const dup = await prisma.barcode.findFirst({ where: { code: { in: data.barcodes } } });
      if (dup) throw new Error(JSON.stringify({ type: ProductError.DUPLICATE_BARCODE, code: dup.code }));
    }

    if (data.prices?.length) {
      await ProductService._validatePriceLists(
        data.prices.map((p) => p.priceListId),
        tenantId
      );
    }

    try {
      return await prisma.product.create({
        data: {
          ...data,
          tenantId,
          barcodes: data.barcodes?.length
            ? { create: data.barcodes.map((code) => ({ code })) }
            : undefined,
          prices: data.prices?.length
            ? {
                create: data.prices.map(({ priceListId, price }) => ({
                  tenantId,
                  priceListId,
                  price,
                })),
              }
            : undefined,
        },
        include: { barcodes: true, ...pricesInclude, ...categoryInclude },
      });
    } catch (e) { rethrowBarcodeError(e); }
  }

static async update(id: number, data: UpdateProductInput, tenantId: number) {
     if (data.categoryId) {
       const category = await prisma.category.findUnique({
         where: { id: data.categoryId, active: true, tenantId },
       });
       if (!category?.active) throw new Error(ProductError.INVALID_CATEGORY);

       const children = await prisma.category.count({
         where: { parentId: data.categoryId, active: true, tenantId },
       });
       if (children > 0) throw new Error(ProductError.CATEGORY_NOT_LEAF);
     }

     if (data.prices?.length) {
       await ProductService._validatePriceLists(
         data.prices.map((p) => p.priceListId),
         tenantId
       );
     }

     const { prices, barcodes, ...productFields } = data;

     let previousImageUrl: string | null | undefined;
     if (productFields.imageUrl !== undefined) {
       const current = await prisma.product.findUnique({
         where: { id, tenantId },
         select: { imageUrl: true },
      });
       previousImageUrl = current?.imageUrl;
     }

     try {
       const updated = await prisma.$transaction(async (tx) => {
        if (prices !== undefined) {
          if (prices.length === 0) {
            await tx.productPrice.updateMany({ 
              where: { productId: id, tenantId }, 
              data: { active: false } 
            });
          } else {
            await Promise.all(
              prices.map(({ priceListId, price }) =>
                tx.productPrice.upsert({
                  where: {
                    tenantId_productId_priceListId: {
                      tenantId,
                      productId: id,
                      priceListId,
                    },
                  },
                  update: { price },
                  create: { tenantId, productId: id, priceListId, price },
                })
              )
            );
          }
        }

        return tx.product.update({
          where: { id, tenantId },
          data: {
            ...productFields,
            barcodes: barcodes
              ? { deleteMany: {}, create: barcodes.map((code) => ({ code })) }
              : undefined,
          },
          include: { barcodes: true, ...pricesInclude, ...categoryInclude },
        });
      });

      if (
        productFields.imageUrl !== undefined &&
        previousImageUrl &&
        previousImageUrl !== productFields.imageUrl
      ) {
        deleteProductImageFile(previousImageUrl);
      }

      return updated;

    } catch (e) { rethrowBarcodeError(e); }
  }

  static async toggleActive(id: number, tenantId: number, active: boolean) {
    return prisma.product.update({ where: { id, tenantId }, data: { active } });
  }

  static async setReorderPoint(
    id: number,
    tenantId: number,
    reorderPoint: number
  ) {
    if (reorderPoint < 0) {
      throw new Error("El punto de reorden no puede ser negativo");
    }
 
    return prisma.product.update({
      where: { id, tenantId },
      data: { reorderPoint },
      select: { id: true, name: true, reorderPoint: true },
    });
  }

  private static async _validatePriceLists(priceListIds: number[], tenantId: number) {
    const uniquePriceListIds = Array.from(new Set(priceListIds));
    const found = await prisma.priceList.findMany({
      where: { id: { in: uniquePriceListIds }, active: true, tenantId },
      select: { id: true },
    });

    if (found.length !== uniquePriceListIds.length) {
      const foundIds = new Set(found.map((p) => p.id));
      const missing = uniquePriceListIds.find((id) => !foundIds.has(id));
      throw new Error(
        JSON.stringify({ type: ProductError.INVALID_PRICE_LIST, priceListId: missing })
      );
    }
  }
  static async upsertPrice(productId: number, tenantId: number, dto: { priceListId: number; price: number }) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: { id: true },
    });
    if (!product) throw new Error("Producto no encontrado");

    await ProductService._validatePriceLists([dto.priceListId], tenantId);

    return prisma.productPrice.upsert({
      where: {
        tenantId_productId_priceListId: {
          tenantId,
          productId,
          priceListId: dto.priceListId,
        },
      },
      update: { price: dto.price },
      create: { tenantId, productId, priceListId: dto.priceListId, price: dto.price },
      include: {
        priceList: { select: { id: true, name: true, active: true } },
      },
    });
  }

  static async removePrice(productId: number, priceListId: number, tenantId: number) {
    const record = await prisma.productPrice.findUnique({
      where: {
        tenantId_productId_priceListId: { tenantId, productId, priceListId },
      },
    });
    if (!record || !record.active) throw new Error("Precio no encontrado");
    return prisma.productPrice.update({
      where: {
        tenantId_productId_priceListId: { tenantId, productId, priceListId },
      },
      data: { active: false },
    });
  }
}
