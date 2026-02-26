import { Request, Response } from "express";
import { SaleService } from "../services/sale.service";

export async function listSales(
  req: Request,
  res: Response
) {
  try {
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

  } catch (error: any) {
    res.status(500).json({
      message:
        error?.message ??
        "Error obteniendo ventas",
    });
  }
}

export async function getSale(req: Request, res: Response) {
  const id = Number(req.params.id);
  const sale = await SaleService.getById(id);

  if (!sale) {
    return res.status(404).json({ message: "Venta no encontrada" });
  }

  res.json(sale);
}

export async function createSale(req: Request, res: Response) {
  try {
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
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function cancelSale(req: Request, res: Response) {
  const id = Number(req.params.id);

  await SaleService.cancel(id);

  res.json({ message: "Venta cancelada" });
}