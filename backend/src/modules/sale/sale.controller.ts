import { Request, Response } from "express";
import { SaleService } from "./sale.service";

export async function listSales(req: Request, res: Response) {
  const warehouseId = (req as any).warehouseId;
  const { tenantId } = req.user!;

  const from =
    typeof req.query.from === "string"
      ? new Date(req.query.from)
      : undefined;

  const to =
    typeof req.query.to === "string"
      ? new Date(req.query.to)
      : undefined;

  const sales = await SaleService.list(
    warehouseId,
    tenantId,
    { from, to }
  );

  res.json(sales);
}

export async function getSale(req: Request, res: Response) {
  const id = Number(req.params.id);
  const warehouseId = (req as any).warehouseId;
  const { tenantId } = req.user!;

  const sale = await SaleService.getById(id, warehouseId, tenantId);

  res.json(sale);
}

export async function createSale(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  const warehouseId = (req as any).warehouseId;
  const { tenantId } = req.user!;
  const { customerId, items, pointsUsed, payments, dueDate, sellerId, priceMode, observations } = req.body;

  const sale = await SaleService.create(
    { customerId, items, pointsUsed, payments, dueDate, sellerId, priceMode, observations },
    req.user.id,
    warehouseId,
    tenantId,
  );

  res.status(201).json(sale);
}

export async function cancelSale(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;

  await SaleService.cancel(id, tenantId);

  res.json({ message: "Venta cancelada" });
}

export async function returnItems(req: Request, res: Response) {
  const id = Number(req.params.id);
  const userId = Number(req.user!.id);
  const warehouseId = (req as any).warehouseId;
  const { tenantId } = req.user!;
  const result = await SaleService.returnItems(id, userId, warehouseId, tenantId, req.body);
  res.json(result);
};