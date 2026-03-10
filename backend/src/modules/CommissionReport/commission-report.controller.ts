import { Request, Response } from "express";
import { CommissionReportService } from "./commission-report.service";

export async function getCommissionReport(req: Request, res: Response) {
  const from =
    typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
  const to =
    typeof req.query.to === "string" ? new Date(req.query.to) : undefined;

  const data = await CommissionReportService.getSummary({ from, to });

  res.json(data);
}