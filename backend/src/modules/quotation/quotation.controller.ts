import { Request, Response } from 'express';
import { QuotationService } from './quotation.service';

const service = new QuotationService();

export class QuotationController {
  async getAll(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const data = await service.getAll(tenantId);
    res.json(data);
  }

  async getById(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const id = Number(req.params.id);
    const data = await service.getById(tenantId, id);
    res.json(data);
  }

  async create(req: Request, res: Response) {
    const userId = Number(req.user!.id);
    const { tenantId } = req.user!;
    const data = await service.create(tenantId, userId, req.body);
    res.status(201).json(data);
  }

  async updateStatus(req: Request, res: Response) {
    const { tenantId } = req.user!;
    const id = Number(req.params.id);
    const data = await service.updateStatus(tenantId, id, req.body.status);
    res.json(data);
  }

  async convertToSale(req: Request, res: Response) {
    const userId = Number(req.user!.id);
    const id = Number(req.params.id);
    const { tenantId } = req.user!;
    const data = await service.convertToSale(
      tenantId,
      id,
      userId,
      req.body.paymentMethod ?? 'CASH'
    );
    res.status(201).json(data);
  }
}