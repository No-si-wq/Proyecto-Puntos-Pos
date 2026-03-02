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

export async function getKardex  (req: Request, res: Response) {
  const warehouseId = (req as any).warehouseId;
  const { productId, from, to, page, pageSize } = req.query;

  if (!productId || !from || !to || !page || !pageSize) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  const result = await ReportService.getKardexRaw(warehouseId, {
    productId: Number(productId),
    from: new Date(from as string),
    to: new Date(to as string),
    page: Number(page),
    pageSize: Number(pageSize),
  });

  res.json(result);
};

export async function getProfitReport (req: Request, res: Response) {
  const warehouseId = (req as any).warehouseId;
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  const result = await ReportService.getProfitReportRaw(warehouseId, {
    from: new Date(from as string),
    to: new Date(to as string),
  });

  res.json(result);
};