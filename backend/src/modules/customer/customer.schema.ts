import { z } from "zod";

export const createCustomerSchema = z.object({
  body: z.object({
    dni: z.string().min(13, "DNI no valido"),
    name: z.string().min(3, "Nombre muy corto"),
    email: z.string().email("Email inválido").optional(),
    phone: z.string().min(6).optional(),
    direction: z.string().min(4).optional(),
    creditLimit: z.number().positive("El límite de crédito debe ser positivo").nullable().optional(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    dni: z.string().min(13, "DNI no valido").optional(),
    name: z.string().min(3).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(6).optional(),
    direction: z.string().min(4).optional(),
    creditLimit: z.number().positive("El límite de crédito debe ser positivo").nullable().optional(),
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