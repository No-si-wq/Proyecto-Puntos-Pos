import prisma from "../../core/prisma";
import { DomainError } from "../../core/errors/domain-error";
import { CreatePriceListDto, UpdatePriceListDto } from "./Pricelist";

export class PriceListService {
  async getAll(tenantId: number) {
    return prisma.priceList.findMany({
      where: { active: true, tenantId },
      orderBy: { name: "asc" },
      include: {
        _count: { 
          select: { 
            prices: {
              where: { active: true }
            },
          }, 
        },
      },
    });
  }

  async getById(id: number, tenantId: number) {
    const priceList = await prisma.priceList.findFirst({
      where: { id, active: true, tenantId },
      include: {
        _count: { select: { prices: true } },
        prices: {
          where: { active: true, tenantId },
          include: {
            product: { select: { id: true, name: true, sku: true, price: true } },
          },
          orderBy: { product: { name: "asc" } },
        },
      },
    });
    if (!priceList) throw new DomainError("Price list not found");
    return priceList;
  }

  async create(data: CreatePriceListDto, tenantId: number) {
    const existing = await prisma.priceList.findFirst({ where: { name: data.name, tenantId } });
    if (existing) throw new DomainError("A price list with this name already exists");
    return prisma.priceList.create({ data: { ...data, tenantId } });
  }

  async update(id: number, data: UpdatePriceListDto, tenantId: number) {
    await this.getById(id, tenantId);
    if (data.name) {
      const existing = await prisma.priceList.findFirst({
        where: { name: data.name, tenantId, NOT: { id } },
      });
      if (existing) throw new DomainError("Ya hay un precio con este nombre");
    }
    return prisma.priceList.update({ where: { id }, data });
  }

  async toggleActive(id: number, tenantId: number, active: boolean) {
    await this.getById(id, tenantId);
    return prisma.priceList.update({ where: { id }, data: { active } });
  }

  async upsertProductPrice(priceListId: number, tenantId: number, productId: number, price: number) {
    await this.getById(priceListId, tenantId);

    const product = await prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) throw new DomainError("Producto no encontrado");

    return prisma.productPrice.upsert({
      where: {
        tenantId_productId_priceListId: { tenantId, productId, priceListId },
      },
      update: { price },
      create: { productId, priceListId, price, active: true, tenantId },
      include: {
        product: { select: { id: true, name: true, sku: true, price: true } },
        priceList: { select: { id: true, name: true, active: true } },
      },
    });
  }

  async removeProductPrice(priceListId: number, productId: number, tenantId: number) {
    const record = await prisma.productPrice.findUnique({
      where: {
        tenantId_productId_priceListId: { tenantId, productId, priceListId },
      },
    });
    if (!record || !record.active) throw new DomainError("No se encontro el precio en la lista de productos");

    return prisma.productPrice.update({
      where: {
        tenantId_productId_priceListId: { tenantId, productId, priceListId },
      },
      data: { active: false },
    });
  }
}

export const priceListService = new PriceListService();
