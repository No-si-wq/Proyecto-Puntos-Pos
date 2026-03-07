import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Nombre inválido"),
    password: z.string().min(6, "Password requerido"),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10, "Refresh token inválido"),
  }),
});