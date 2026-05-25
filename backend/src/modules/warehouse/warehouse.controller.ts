import { Request, Response } from "express";
import { WarehouseService } from "./warehouse.service";

export async function getWarehouses(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const data = await WarehouseService.getAll(tenantId);
  res.json(data);
}

export async function getWarehouse(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const data = await WarehouseService.getById(id, tenantId);
  res.json(data);
}

export async function createWarehouse(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const data = await WarehouseService.create(req.body, tenantId);
  res.status(201).json(data);
}

export async function updateWarehouse(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const data = await WarehouseService.update(id, req.body, tenantId);
  res.json(data);
}

export async function toggleWarehouseActive(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const { active } = req.body;
  await WarehouseService.toggleActive(id, tenantId, Boolean(active));
  res.status(204).send();
}
