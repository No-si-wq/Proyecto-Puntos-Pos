import { z } from "zod";
import { Role } from "../user/roles";

export const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Nombre muy corto"),
    name: z.string().min(3, "Nombre muy corto"),
    password: z.string().min(6, "Password mínimo 6 caracteres"),
    warehouseId: z.number().int().nonnegative().optional(),
    role: z.nativeEnum(Role),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    username: z.string().min(3).optional(),
    name: z.string().min(3).optional(),
    role: z.nativeEnum(Role).optional(),
    warehouseId: z.number().int().positive().optional(),
    active: z.boolean().optional(),
  }),
});

export const toggleUserSchema = z.object({
  body: z.object({
    active: z.boolean(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID inválido"),
  }),
});