import { Request, Response } from "express";
import { ReportService } from "../services/report.service";

export async function getPurchaseLotsReport(req: Request, res: Response) {
  const warehouseId = (req as any).warehouseId;

  const days = req.query.days
    ? Number(req.query.days)
    : undefined;

  const expired = req.query.expired === "true";

  const product =
    typeof req.query.product === "string"
      ? req.query.product.trim()
      : undefined;

  const data = await ReportService.listLots(
    warehouseId,
    { days, expired, product }
  );

  res.json(data);
}