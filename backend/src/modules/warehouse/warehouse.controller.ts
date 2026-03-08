import { Request, Response } from "express";
import { WarehouseService } from "./warehouse.service";

export async function getWarehouses(req: Request, res: Response) {
  const data = await WarehouseService.getAll();
  res.json(data);
}

export async function getWarehouse(req: Request, res: Response) {
  const id = Number(req.params.id);
  const data = await WarehouseService.getById(id);
  res.json(data);
}

export async function createWarehouse(req: Request, res: Response) {
  const data = await WarehouseService.create(req.body);
  res.status(201).json(data);
}

export async function updateWarehouse(req: Request, res: Response) {
  const id = Number(req.params.id);
  const data = await WarehouseService.update(id, req.body);
  res.json(data);
}

export async function toggleWarehouseActive(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { active } = req.body;
  await WarehouseService.toggleActive(id, Boolean(active));
  res.status(204).send();
}
