import { Request, Response } from "express";
import { InventoryService } from "./inventory.service";
import prisma from "../../core/prisma";

export async function getInventoryList(req: Request, res: Response) {
  const warehouseId = (req as any).warehouseId;
  const { tenantId } = req.user!;

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
      tenantId,
      warehouseId,
      search,
    });

  res.json(result);
}

export async function getStock(req: Request, res: Response) {
  const productId = Number(req.params.productId);
  const warehouseId = (req as any).warehouseId;
  const { tenantId } = req.user!;

  const stock = await InventoryService.getStock(
    productId,
    warehouseId,
    tenantId,
  );

  res.json({ productId, warehouseId, stock });
}

export async function getLotsByProduct(req: Request, res: Response) {
  const productId = Number(req.params.productId);
  const warehouseId = (req as any).warehouseId;
  const { tenantId } = req.user!;

  const lots = await InventoryService.getLotsByProduct(productId, tenantId, warehouseId);

  res.json(lots);
}

export async function getAllLots(req: Request, res: Response) {
  const warehouseId = (req as any).warehouseId;
  const { tenantId } = req.user!;

  const lots = await InventoryService.getAllLots(tenantId, warehouseId);

  res.json(lots);
}

export async function getExpiringInventory(req: Request, res: Response) {
  const days = Number(req.query.days ?? 60);
  const warehouseId = (req as any).warehouseId;
  const { tenantId } = req.user!;

  const data = await InventoryService.getExpiringLots(days, warehouseId, tenantId);

  res.json(data);
}

export async function transferInventory(req: Request, res: Response) {
  const {
    productId,
    fromWarehouseId,
    toWarehouseId,
    quantity,
  } = req.body;

  const { tenantId } = req.user!;

  await InventoryService.transfer({
    tenantId,
    productId,
    fromWarehouseId,
    toWarehouseId,
    quantity,
  });

  res.status(201).json({
    message: "Transferencia realizada",
  });
}

export async function TransferProduct(req: Request, res: Response) {
  const {
    fromProductId,
    toProductId,
    quantity,
    factor,
  } = req.body;
  const { tenantId } = req.user!;
  const warehouseId = (req as any).warehouseId;

  await InventoryService.transferProduct({
    tenantId,
    warehouseId,
    fromProductId,
    toProductId,
    quantity,
    factor,
  });

  res.status(201).json({
    message: "Transferencia realizada",
  });
}

export async function TransferWarehouse(req: Request, res: Response) {
  const { fromWarehouseId, toWarehouseId, items } = req.body;
  const { tenantId, id: userId } = req.user!;

  await InventoryService.transferWarehouse({
    tenantId,
    fromWarehouseId,
    toWarehouseId,
    items,
  });

  res.status(201).json({ message: "Transferencia realizada" });
}

export async function adjustInventory(req: Request, res: Response) {
  const { productId, physicalQuantity, note } = req.body;
  const { tenantId, id: createdBy } = req.user!;
  const warehouseId = (req as any).warehouseId;

  const result = await InventoryService.adjust({
    tenantId,
    productId,
    warehouseId,
    physicalQuantity,
    note,
    createdBy,
  });

  res.status(200).json(result);
}

export async function getTransferReport(req: Request, res: Response) {
  const { productId, from, to } = req.query;  // ← req.body → req.query
  const warehouseId = (req as any).warehouseId;
  const { tenantId } = req.user!;
  const fromDate = typeof from === "string" ? new Date(from) : undefined;
  const toDate = typeof to === "string" ? new Date(to) : undefined;

  if (fromDate && Number.isNaN(fromDate.getTime())) {
    return res.status(400).json({ message: "Fecha 'from' inválida" });
  }

  if (toDate && Number.isNaN(toDate.getTime())) {
    return res.status(400).json({ message: "Fecha 'to' inválida" });
  }

  const data = await InventoryService.getTransferReport({
    tenantId,
    warehouseId,
    productId: productId ? Number(productId) : undefined,  // ← query params llegan como string
    from: fromDate,
    to: toDate,
  });

  res.json(data);
}
