import { z } from "zod";
import { Role } from "../types/roles";

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email("Email inválido"),
    username: z.string().min(3, "Nombre muy corto"),
    name: z.string().min(3, "Nombre muy corto"),
    password: z.string().min(6, "Password mínimo 6 caracteres"),
    role: z.nativeEnum(Role),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    username: z.string().min(3).optional(),
    name: z.string().min(3).optional(),
    role: z.nativeEnum(Role).optional(),
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