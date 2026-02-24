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