import { Request, Response } from "express";
import { priceListService } from "./Pricelist.service";

export async function getAll(_req: Request, res: Response) {
  const data = await priceListService.getAll();
  res.json(data);
}

export async function getById(req: Request, res: Response) {
  const data = await priceListService.getById(Number(req.params.id));
  res.json(data);
}

export async function create(req: Request, res: Response) {
  const data = await priceListService.create(req.body);
  res.status(201).json(data);
}

export async function update(req: Request, res: Response) {
  const data = await priceListService.update(Number(req.params.id), req.body);
  res.json(data);
}

export async function togglePriceList(req: Request, res: Response) {
  const data = await priceListService.toggleActive(
    Number(req.params.id),
    req.body.active
  );
  res.json(data);
}

export async function upsertProductPrice(req: Request, res: Response) {
  const priceListId = Number(req.params.id);
  const { productId, price } = req.body;
  const data = await priceListService.upsertProductPrice(priceListId, productId, price);
  res.json(data);
}

export async function removeProductPrice(req: Request, res: Response) {
  const priceListId = Number(req.params.id);
  const productId   = Number(req.params.productId);
  await priceListService.removeProductPrice(priceListId, productId);
  res.status(204).send();
}