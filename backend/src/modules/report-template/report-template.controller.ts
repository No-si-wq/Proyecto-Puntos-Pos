import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ReportTemplateService } from "./report-template.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await ReportTemplateService.list(tenantId);
  res.json(data);
});

export const getDefault = asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await ReportTemplateService.getDefault(tenantId);
  res.json(data);
});

export const getDefaultByType = asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const documentType = req.query.type as 'sale' | 'quotation';
  const data = await ReportTemplateService.getDefaultByType(tenantId, documentType ?? 'sale');
  res.json(data);
});

export const getReportById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const data = await ReportTemplateService.getById(id, tenantId);
  res.json(data);
});

export const createReport = asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const data = await ReportTemplateService.create(req.body, tenantId);
  res.json(data);
});

export const updateReport = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const data = await ReportTemplateService.update(id, tenantId, req.body);
  res.json(data);
});

export const deleteReport = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const data = await ReportTemplateService.delete(id, tenantId);
  res.json(data);
});

export const duplicateReport = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { tenantId } = req.user!;
  const { newName } = req.body;
  const data = await ReportTemplateService.duplicate(id, tenantId, newName);
  res.json(data);
});