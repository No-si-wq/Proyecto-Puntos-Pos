import prisma from "../../core/prisma";
import { DomainError } from "../../core/errors/domain-error";
import { CreatePriceListDto, UpdatePriceListDto } from "./Pricelist";

export class PriceListService {
  async getAll() {
    return prisma.priceList.findMany({
      where: { active: true },
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

  async getById(id: number) {
    const priceList = await prisma.priceList.findUnique({
      where: { id, active: true },
      include: {
        _count: { select: { prices: true } },
        prices: {
          where: { active: true },
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

  async create(data: CreatePriceListDto) {
    const existing = await prisma.priceList.findUnique({ where: { name: data.name } });
    if (existing) throw new DomainError("A price list with this name already exists");
    return prisma.priceList.create({ data });
  }

  async update(id: number, data: UpdatePriceListDto) {
    await this.getById(id);
    if (data.name) {
      const existing = await prisma.priceList.findFirst({
        where: { name: data.name, NOT: { id } },
      });
      if (existing) throw new DomainError("A price list with this name already exists");
    }
    return prisma.priceList.update({ where: { id }, data });
  }

  async toggleActive(id: number, active: boolean) {
    await this.getById(id);
    return prisma.priceList.update({ where: { id }, data: { active } });
  }

  async upsertProductPrice(priceListId: number, productId: number, price: number) {
    await this.getById(priceListId);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new DomainError("Producto no eoncontrado");

    return prisma.productPrice.upsert({
      where: { productId_priceListId: { productId, priceListId } },
      update: { price, active: true },
      create: { productId, priceListId, price, active: true },
      include: {
        product: { select: { id: true, name: true, sku: true, price: true } },
        priceList: { select: { id: true, name: true, active: true } },
      },
    });
  }

  async removeProductPrice(priceListId: number, productId: number) {
    const record = await prisma.productPrice.findUnique({
      where: { productId_priceListId: { productId, priceListId } },
    });
    if (!record || !record.active) throw new DomainError("No se encontro el precio en la lista de productos");

    return prisma.productPrice.update({
      where: { productId_priceListId: { productId, priceListId } },
      data: { active: false },
    });
  }
}

export const priceListService = new PriceListService();