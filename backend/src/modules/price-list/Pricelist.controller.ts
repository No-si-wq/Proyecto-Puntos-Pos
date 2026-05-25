import { Request, Response } from "express";
import { priceListService } from "./Pricelist.service";

export async function getAll(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const data = await priceListService.getAll(tenantId);
  res.json(data);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const data = await priceListService.getById(id, tenantId);
  res.json(data);
}

export async function create(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const data = await priceListService.create(req.body, tenantId);
  res.status(201).json(data);
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const data = await priceListService.update(id, req.body, tenantId);
  res.json(data);
}

export async function togglePriceList(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { active } = req.body;
  const { tenantId } = req.user!;
  const data = await priceListService.toggleActive(
    id,
    tenantId,
    active
  );
  res.json(data);
}

export async function upsertProductPrice(req: Request, res: Response) {
  const priceListId = Number(req.params.id);
  const { tenantId } = req.user!;
  const { productId, price } = req.body;
  const data = await priceListService.upsertProductPrice(priceListId, tenantId, productId, price);
  res.json(data);
}

export async function removeProductPrice(req: Request, res: Response) {
  const priceListId = Number(req.params.id);
  const productId   = Number(req.params.productId);
  const { tenantId } = req.user!;
  await priceListService.removeProductPrice(priceListId, productId, tenantId);
  res.status(204).send();
}