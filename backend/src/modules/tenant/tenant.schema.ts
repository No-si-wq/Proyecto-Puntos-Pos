import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const inviteRegex = /^[a-f0-9]{32}$/;

export const registerTenantSchema = 
z.object({
  body: z.object({
    inviteCode: z
      .string()
      .trim()
      .toLowerCase()
      .regex(inviteRegex, "Código de invitación inválido"),

    company: z.object({

      name: z
        .string()
        .trim()
        .min(2, "El nombre de la empresa es requerido")
        .max(120, "Nombre demasiado largo"),

      slug: z
        .string()
        .trim()
        .toLowerCase()
        .min(3, "El identificador debe tener al menos 3 caracteres")
        .max(40, "El identificador no puede superar 40 caracteres")
        .regex(slugRegex, "Solo letras minúsculas, números y guiones"),
    }),

    admin: z.object({

      username: z
        .string()
        .trim()
        .toLowerCase()
        .min(3, "El username debe tener al menos 3 caracteres")
        .max(20, "El username no puede superar 20 caracteres"),

      password: z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .max(100, "Contraseña demasiado larga")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
          "Debe contener mayúscula, minúscula y número"
        ),

      confirmPassword: z.string(),

      name: z
        .string()
        .trim()
        .max(80, "Nombre demasiado largo")
        .optional(),
    }),
  }),
})
.refine(
  (data) => data.body.admin.password === data.body.admin.confirmPassword,
  {
    message: "Las contraseñas no coinciden",
    path: ["body", "admin", "confirmPassword"],
  }
);

export type RegisterTenantInput = z.infer<typeof registerTenantSchema>;