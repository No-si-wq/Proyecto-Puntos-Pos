import { Request, Response } from 'express';
import { remissionService } from './remission.service';
import { asyncHandler } from '../../core/utils/asyncHandler';

export const remissionController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = req.user!;
    const userId = Number(req.user!.id);
    const remission = await remissionService.create(tenantId, userId, req.body);
    res.status(201).json(remission);
  }),

  findAll: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = req.user!;
    const warehouseId = req.query.warehouseId
      ? Number(req.query.warehouseId)
      : undefined;
    const remissions = await remissionService.findAll(tenantId, warehouseId);
    res.json(remissions);
  }),

  findOne: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = req.user!;
    const id = Number(req.params.id);
    const remission = await remissionService.findOne(tenantId, id);
    res.json(remission);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = req.user!;
    const id = Number(req.params.id);
    await remissionService.cancel(tenantId, id);
    res.json({ message: 'Remisión cancelada' });
  }),

  deliver: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = req.user!;
    const id = Number(req.params.id);
    await remissionService.deliver(tenantId, id);
    res.json({ message: 'Remisión marcada como entregada' });
  }),
};