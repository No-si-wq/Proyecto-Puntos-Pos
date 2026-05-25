import { Request, Response } from "express";
import { commissionService } from "./Commission.service";
import { asyncHandler } from "../../core/utils/asyncHandler";

export const getAllLevels = asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await commissionService.getAllLevels(tenantId);
  res.json(data);
});

export const getLevelById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const data = await commissionService.getLevelById(id, tenantId);
  res.json(data);
});

export const createLevel = asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await commissionService.createLevel(req.body, tenantId);
  res.status(201).json(data);
});

export const updateLevel = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const data = await commissionService.updateLevel(id, req.body, tenantId);
  res.json(data);
});

export const removeLevel = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const { active } = req.body;
  await commissionService.removeLevel(id, tenantId, active);
  res.status(204).send();
});

export const getAllCommissions = asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await commissionService.getAllCommissions(tenantId);
  res.json(data);
});

export const getCommissionsByUser = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.userId);
  const { tenantId } = req.user!;

  let from: Date | undefined;
  let to: Date | undefined;

  // ✅ Nuevo: filtro por mes
  if (typeof req.query.month === "string") {
    const [year, month] = req.query.month.split("-").map(Number);
    from = new Date(year, month - 1, 1);           // primer día del mes
    to   = new Date(year, month, 0, 23, 59, 59);   // último día del mes
  } else {
    from = typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
    to   = typeof req.query.to   === "string" ? new Date(req.query.to)   : undefined;
  }

  const data = await commissionService.getCommissionsByUser(id, tenantId, { from, to });
  res.json(data);
});

export async function getCommissionReport(req: Request, res: Response) {
  const from =
    typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
  const to =
    typeof req.query.to === "string" ? new Date(req.query.to) : undefined;
  
  const { tenantId } = req.user!;

  const data = await commissionService.getSummary( tenantId, { from, to });

  res.json(data);
}

export const assignCommission = asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await commissionService.assignCommission(req.body, tenantId);
  res.status(200).json(data);
});

export const updateCommission = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const data = await commissionService.updateCommission(id, req.body, tenantId);
  res.json(data);
});

export const removeCommission = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const { active } = req.body;
  await commissionService.removeCommission(id, tenantId, active);
  res.status(204).send();
});