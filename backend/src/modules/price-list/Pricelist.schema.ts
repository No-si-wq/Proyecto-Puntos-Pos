import { z } from "zod";

export const createPriceListSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    active: z.boolean().optional().default(true),
  }),
});

export const updatePriceListSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    active: z.boolean().optional(),
  }),
});