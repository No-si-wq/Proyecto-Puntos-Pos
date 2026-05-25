import prisma from "../../core/prisma";
import { Prisma } from "@prisma/client";
import {
  CreateReportTemplateInput,
  UpdateReportTemplateInput,
  ReportTemplateError,
} from "./report-template";

const toInputJson = (
  value: Prisma.JsonValue | unknown
): Prisma.InputJsonValue | Prisma.JsonNullValueInput =>
  value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

export class ReportTemplateService {
  static async list(tenantId: number) {
    return prisma.reportTemplate.findMany({
      where: { tenantId, active: true },
      select: {
        id: true,
        name: true,
        description: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
  }

  static async getById(id: number, tenantId: number) {
    const template = await prisma.reportTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) throw new Error(ReportTemplateError.NOT_FOUND);
    return template;
  }

  static async create(data: CreateReportTemplateInput, tenantId: number) {
    const nameTaken = await prisma.reportTemplate.findFirst({
      where: { tenantId, name: data.name },
      select: { id: true },
    });

    if (nameTaken) throw new Error(ReportTemplateError.NAME_TAKEN);

    if (data.isDefault) {
      await prisma.reportTemplate.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.reportTemplate.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description ?? null,
        config: toInputJson(data.config as unknown),
        isDefault: data.isDefault ?? false,
      },
    });
  }

  static async update(id: number, tenantId: number, data: UpdateReportTemplateInput) {
    const existing = await prisma.reportTemplate.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) throw new Error(ReportTemplateError.NOT_FOUND);

    if (data.name) {
      const nameTaken = await prisma.reportTemplate.findFirst({
        where: { tenantId, name: data.name, id: { not: id } },
        select: { id: true },
      });
      if (nameTaken) throw new Error(ReportTemplateError.NAME_TAKEN);
    }

    if (data.isDefault) {
      await prisma.reportTemplate.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return prisma.reportTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.config !== undefined && { config: toInputJson(data.config as unknown) }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    });
  }

  static async delete(id: number, tenantId: number) {
    const existing = await prisma.reportTemplate.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) throw new Error(ReportTemplateError.NOT_FOUND);

    return prisma.reportTemplate.update({ 
        where: { id },
        data: { active: false },
    });
  }

  static async getDefault(tenantId: number) {
    return prisma.reportTemplate.findFirst({
      where: { tenantId, isDefault: true },
    });
  }

  static async getDefaultByType(tenantId: number, documentType: 'sale' | 'quotation') {
    const template = await prisma.reportTemplate.findFirst({
      where: {
        tenantId,
        active: true,
        isDefault: true,
        config: { path: ['documentType'], equals: documentType },
      },
    });
    // Si no hay default específico para el tipo, devuelve el default general
    if (!template) return ReportTemplateService.getDefault(tenantId);
    return template;
  }

  static async duplicate(id: number, tenantId: number, newName: string) {
    const source = await prisma.reportTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!source) throw new Error(ReportTemplateError.NOT_FOUND);

    const nameTaken = await prisma.reportTemplate.findFirst({
      where: { tenantId, name: newName },
      select: { id: true },
    });

    if (nameTaken) throw new Error(ReportTemplateError.NAME_TAKEN);

    return prisma.reportTemplate.create({
      data: {
        tenantId,
        name: newName,
        description: source.description,
        config: toInputJson(source.config),
        isDefault: false,
      },
    });
  }
}
