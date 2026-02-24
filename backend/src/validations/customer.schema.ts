import { z } from "zod";

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Nombre muy corto"),
    email: z.string().email("Email inválido").optional(),
    phone: z.string().min(6).optional(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(6).optional(),
    active: z.boolean().optional(),
  }),
});

export const customerIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID inválido"),
  }),
});

export const toggleCustomerSchema = z.object({
  body: z.object({
    active: z.boolean(),
  }),
});