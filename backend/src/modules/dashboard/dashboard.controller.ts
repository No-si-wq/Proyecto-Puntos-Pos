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

  const data = await AdminDashboardService.getDashboard();

  res.json(data);
}