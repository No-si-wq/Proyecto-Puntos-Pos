import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";
import { AdminDashboardService } from "./adminDashboard.service";
import dayjs from "dayjs";

export async function getDashboard(req: Request, res: Response) {
  const warehouseId = (req as any).warehouseId;

  if (!warehouseId) {
    return res.status(400).json({
      message: "Almacén no seleccionado",
    });
  }

  const data =
    await DashboardService.getSummary(warehouseId);

  res.json(data);
}

export async function getAdminDashboard(req: Request, res: Response) {
  const from =
    typeof req.query.from === "string"
      ? dayjs(req.query.from).startOf("day").toDate()
      : undefined;

  const to =
    typeof req.query.to === "string"
      ? dayjs(req.query.to).endOf("day").toDate()
      : undefined;

  const data =
    await AdminDashboardService.getDashboard({
      from,
      to,
    });

  res.json(data);
}