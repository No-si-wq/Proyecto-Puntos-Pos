import { Response, NextFunction } from "express";
import type { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    warehouseId?: number;
  }
}

export function requireWarehouse(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.header("x-warehouse-id");

  if (!header) {
    return res.status(400).json({
      message: "Warehouse requerido",
    });
  }

  const warehouseId = Number(header);

  if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
    return res.status(400).json({
      message: "Warehouse inválido",
    });
  }

  req.warehouseId = warehouseId;

  next();
}