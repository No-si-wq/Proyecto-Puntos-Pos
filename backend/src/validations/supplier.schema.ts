import { z } from "zod";

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
});

export const updateSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    active: z.boolean().optional(),
  }),
});