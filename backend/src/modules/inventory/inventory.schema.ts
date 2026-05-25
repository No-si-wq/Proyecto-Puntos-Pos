import { z } from "zod";

export const productStockParamSchema = z.object({
  params: z.object({
    productId: z.coerce.number().int().positive(),
  }),
});

export const productLotsParamSchema = z.object({
  params: z.object({
    productId: z.coerce.number().int().positive(),
  }),
  query: z.object({
  })
});

export const inventoryListQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
  }),
});

export const inventoryExpiringQuerySchema = z.object({
  query: z.object({
    days: z.coerce
      .number()
      .int()
      .positive()
      .max(365)
      .optional(),
  }),
});

export const inventoryAdjustSchema = z.object({
  body: z.object({
    productId: z.number().int().positive(),
    physicalQuantity: z.number().int().min(0),
    note: z.string().min(1, "La nota es requerida"),
  }),
});

export const transferReportSchema = z.object({
  query: z.object({
    warehouseId: z.coerce.number().int().positive().optional(),
    productId: z.coerce.number().int().positive().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});