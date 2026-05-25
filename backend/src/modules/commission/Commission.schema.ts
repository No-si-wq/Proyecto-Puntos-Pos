import { z } from "zod";

export const createCommissionLevelSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    priceListId:   z.number().int().positive().optional(),
  }),
});

export const updateCommissionLevelSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    priceListId:   z.number().int().positive().optional(),
  }),
});

export const assignCommissionSchema = z.object({
  body: z.object({
    userId: z.number().int().positive(),
    levelId: z.number().int().positive(),
    percent: z
      .number()
      .min(0, "Percent must be >= 0")
      .max(100, "Percent must be <= 100"),
  }),
});

export const updateCommissionSchema = z.object({
  body: z.object({
    percent: z
      .number()
      .min(0, "Percent must be >= 0")
      .max(100, "Percent must be <= 100"),
  }),
});