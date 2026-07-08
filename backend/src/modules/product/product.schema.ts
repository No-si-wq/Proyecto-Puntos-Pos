import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(3),
    name: z.string().min(3),
    description: z.string().optional(),
    price: z.number().positive(),
    cost: z.number().positive(),
    tax: z.number().nonnegative(),
    laboratory: z.string().optional(),
    observations: z.string().optional(),
    categoryId: z.number().int().positive(),
    imageUrl: z.string().nullable().optional(),

    barcodes: z
      .array(
        z.string().min(4, "Código de barras inválido")
      )
      .optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    sku: z.string().min(3).optional(),
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    cost: z.number().positive().optional(),
    tax: z.number().nonnegative().optional(),
    laboratory: z.string().optional(),
    observations: z.string().optional(),
    categoryId: z.number().int().positive().optional(),
    active: z.boolean().optional(),
    imageUrl: z.string().nullable().optional(),

    barcodes: z
      .array(
        z.string().min(4, "Código de barras inválido")
      )
      .optional(),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});