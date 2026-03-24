import { Request, Response } from "express";
import { commissionService } from "./Commission.service";
import { asyncHandler } from "../../core/utils/asyncHandler";

export const getAllLevels = asyncHandler(async (_req: Request, res: Response) => {
  const data = await commissionService.getAllLevels();
  res.json(data);
});

export const getLevelById = asyncHandler(async (req: Request, res: Response) => {
  const data = await commissionService.getLevelById(Number(req.params.id));
  res.json(data);
});

export const createLevel = asyncHandler(async (req: Request, res: Response) => {
  const data = await commissionService.createLevel(req.body);
  res.status(201).json(data);
});

export const updateLevel = asyncHandler(async (req: Request, res: Response) => {
  const data = await commissionService.updateLevel(Number(req.params.id), req.body);
  res.json(data);
});

export const removeLevel = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { active } = req.body;
  await commissionService.removeLevel(id, active);
  res.status(204).send();
});

export const getAllCommissions = asyncHandler(async (_req: Request, res: Response) => {
  const data = await commissionService.getAllCommissions();
  res.json(data);
});

export const getCommissionsByUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  const data = await commissionService.getCommissionsByUser(userId);
  res.json(data);
});

export const assignCommission = asyncHandler(async (req: Request, res: Response) => {
  const data = await commissionService.assignCommission(req.body);
  res.status(200).json(data);
});

export const updateCommission = asyncHandler(async (req: Request, res: Response) => {
  const data = await commissionService.updateCommission(Number(req.params.id), req.body);
  res.json(data);
});

export const removeCommission = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { active } = req.body;
  await commissionService.removeCommission(id, active);
  res.status(204).send();
});

export const getCommissionReport = asyncHandler( async (req: Request, res: Response) => {
  const from =
    typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
  const to =
    typeof req.query.to === "string" ? new Date(req.query.to) : undefined;

  const data = await commissionService.getSummary({ from, to });

  res.json(data);
})