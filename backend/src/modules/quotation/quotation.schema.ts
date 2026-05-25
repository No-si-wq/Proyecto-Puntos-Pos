import { z } from 'zod';

const quotationItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  discountType: z.enum(['NONE', 'PERCENTAGE', 'FIXED']).default('NONE'),
  discountValue: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
});

const createQuotationBody = z.object({
  customerId: z.number().int().positive().optional(),
  warehouseId: z.number().int().positive(),
  priceListId: z.number().int().positive().optional(),
  sellerId: z.number().int().positive().optional(),
  observations: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  items: z.array(quotationItemSchema).min(1),
});

const updateQuotationStatusBody = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'EXPIRED']),
});

const quotationParamsSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const createQuotationSchema = z.object({
  body: createQuotationBody,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateQuotationStatusSchema = z.object({
  body: updateQuotationStatusBody,
  params: quotationParamsSchema,
  query: z.object({}).optional(),
});