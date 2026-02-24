import { Request, Response } from "express";
import { InventoryService } from "../services/inventory.service";

export async function getInventoryList(
  req: Request,
  res: Response
) {
  try {
    const warehouseId = (req as any).warehouseId;

    if (Number.isNaN(warehouseId) || warehouseId <= 0) {
      return res.status(400).json({
        message: "Warehouse inválido",
      });
    }

    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const result =
      await InventoryService.getInventorySummary({
        warehouseId,
        search,
      });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      message:
        error?.message ??
        "Error obteniendo inventario",
    });
  }
}

export async function getStock(
  req: Request,
  res: Response
) {
  const productId = Number(req.params.productId);
  const warehouseId = (req as any).warehouseId;

  const stock = await InventoryService.getStock(
    productId,
    warehouseId
  );

  res.json({ productId, warehouseId, stock });
}

export async function getLotsByProduct(req: Request, res: Response) {
  const productId = Number(req.params.productId);
  const warehouseId = (req as any).warehouseId;

  const lots = await InventoryService.getLotsByProduct(productId, warehouseId);

  res.json(lots);
}

export async function getExpiringInventory(req: Request, res: Response) {
  const days = Number(req.query.days ?? 60);
  const warehouseId = (req as any).warehouseId;

  const data = await InventoryService.getExpiringLots(days, warehouseId);

  res.json(data);
}

export async function transferInventory(
  req: Request,
  res: Response
) {
  const {
    productId,
    fromWarehouseId,
    toWarehouseId,
    quantity,
  } = req.body;

  await InventoryService.transfer({
    productId,
    fromWarehouseId,
    toWarehouseId,
    quantity,
  });

  res.status(201).json({
    message: "Transferencia realizada",
  });
}