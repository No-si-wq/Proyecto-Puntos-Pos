import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";
import { AdminDashboardService } from "./adminDashboard.service";
import dayjs from "dayjs";

export async function getDashboard(req: Request, res: Response) {
  const { tenantId } = req.user!;
  const warehouseId = (req as any).warehouseId;

  if (!warehouseId) {
    return res.status(400).json({
      message: "Almacén no seleccionado",
    });
  }

  const data =
    await DashboardService.getSummary(warehouseId, tenantId);

  res.json(data);
}

export async function getAdminDashboard(req: Request, res: Response) {
  const { tenantId } = req.user!;

  const data = await AdminDashboardService.getDashboard(tenantId);

  res.json(data);
}