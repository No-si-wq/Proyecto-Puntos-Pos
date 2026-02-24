import { z } from "zod";

export const createSaleSchema = z.object({
  body: z.object({
    customerId: z.number().int().positive().optional(),
    pointsUsed: z.number().int().nonnegative().optional(),
    items: z
      .array(
        z.object({
          productId: z.number().int().positive(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1),
  }),
});

export const saleIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});