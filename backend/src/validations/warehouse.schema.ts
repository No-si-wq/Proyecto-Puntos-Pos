import { z } from "zod";

export const createWarehouseSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(2).optional(),
  active: z.boolean().optional(),
});