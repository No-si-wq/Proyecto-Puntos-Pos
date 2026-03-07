import { Request, Response } from "express";
import { SaleService } from "./sale.service";

export async function listSales(req: Request, res: Response) {
  const warehouseId = (req as any).warehouseId;

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
    { from, to }
  );

  res.json(sales);
}

export async function getSale(req: Request, res: Response) {
  const id = Number(req.params.id);
  const warehouseId = (req as any).warehouseId;

  const sale = await SaleService.getById(id, warehouseId);

  res.json(sale);
}

export async function createSale(req: Request, res: Response) {
  const warehouseId = (req as any).warehouseId;
  const { customerId, items, pointsUsed, paymentMethod, dueDate } = req.body;

    if (!req.user) {
      return res.status(401).json({
        message: "Usuario no autenticado",
      });
    }

  const sale = await SaleService.create(
    { customerId, items, pointsUsed, paymentMethod, dueDate },
    req.user.id,
    warehouseId,
  );
  res.status(201).json(sale);
}

export async function cancelSale(req: Request, res: Response) {
  const id = Number(req.params.id);

  await SaleService.cancel(id);

  res.json({ message: "Venta cancelada" });
}