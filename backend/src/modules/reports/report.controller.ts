import { Request, Response } from "express";
import { ReportService } from "./report.service";

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

export async function getKardex(req: Request, res: Response) {

  const warehouseId = (req as any).warehouseId;

  const { productId, from, to, pageSize, cursorCreatedAt, cursorId } = req.query;

  if (!productId || !from || !to || !pageSize) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  const cursor =
    cursorCreatedAt && cursorId
      ? {
          createdAt: new Date(String(cursorCreatedAt)),
          id: BigInt(String(cursorId)),
        }
      : undefined;

  const result = await ReportService.getKardexRaw(warehouseId, {
    productId: Number(productId),
    from: new Date(String(from)),
    to: new Date(String(to)),
    pageSize: Math.max(1, Number(pageSize)),
    cursor,
  });

  res.json(result);
}

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