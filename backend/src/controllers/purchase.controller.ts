import { Request, Response } from "express";
import { PurchaseService } from "../services/purchase.service";

export async function listPurchases(req: Request, res: Response) {
  const warehouseId = (req as any).warehouseId;
  const from =
    typeof req.query.from === "string"
      ? new Date(req.query.from)
      : undefined;

  const to =
    typeof req.query.to === "string"
      ? new Date(req.query.to)
      : undefined;

  const purchases = await PurchaseService.list(
    warehouseId,
    {from, to}
  );
  res.json(purchases);
}

export async function createPurchase(req: Request, res: Response) {
  try {
    const warehouseId = (req as any).warehouseId;

    if (!warehouseId) {
      return res.status(400).json({
        message: "Almacen no seleccionado"
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Usuario no autenticado",
      });
    }

    const { supplierId, items, paymentMethod, dueDate } = req.body;

    if (!supplierId) {
      return res.status(400).json({
        message: "Proveedor requerido",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "La compra no tiene items",
      });
    }

    const purchase = await PurchaseService.create(
      { supplierId, items, paymentMethod, dueDate },
      req.user?.id,
      warehouseId,
    );

    res.status(201).json(purchase);

  } catch (err: any) {
    console.error("PURCHASE ERROR:", err);

    return res.status(400).json({
      message: err.message || "Error registrando la compra",
    });
  }
}