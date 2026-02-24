import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(3),
    name: z.string().min(3),
    description: z.string().optional(),
    price: z.number().positive(),
    cost: z.number().positive(),
    categoryId: z.number().int().positive(),

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
    categoryId: z.number().int().positive().optional(),
    active: z.boolean().optional(),

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