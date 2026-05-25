import { z } from 'zod';

export const createRemissionSchema = z.object({
  body: z.object({
    warehouseId: z.number().int().positive(),
    customerId: z.number().int().positive().optional(),
    note: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.number().int().positive(),
          quantity: z.number().int().positive(),
          note: z.string().optional(),
        })
      )
      .min(1, 'Debe incluir al menos un producto'),
  }),
});