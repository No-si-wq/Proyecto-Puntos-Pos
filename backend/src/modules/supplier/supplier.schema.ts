import { z } from "zod";

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    rtn: z.string().min(13, "RTN invalido"),
  }),
});

export const updateSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    rtn: z.string().min(13, "RTN invalido").optional(),
    active: z.boolean().optional(),
  }),
});

export const toggleSupplierSchema = z.object({
  body: z.object({
    active: z.boolean(),
  }),
});