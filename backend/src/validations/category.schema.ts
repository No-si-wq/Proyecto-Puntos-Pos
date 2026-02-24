import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre es demasiado largo"),

    parentId: z
      .coerce
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),

    active: z.boolean().optional().default(true),
  }),
});


export const createHierarchySchema = z.object({
  body: z.object({
    rootCategoryId: z
      .coerce
      .number()
      .int()
      .positive("La categoría raíz debe ser válida"),

    levels: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Los niveles no pueden estar vacíos")
          .max(100, "Nivel demasiado largo")
      )
      .min(1, "Debe especificar al menos un nivel"),
  }),
});


export const updateCategorySchema = z.object({
  params: z.object({
    id: z.coerce
      .number()
      .int()
      .positive("ID inválido"),
  }),

  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(100)
        .optional(),

      parentId: z
        .coerce
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),

      active: z.boolean().optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: "Debe enviar al menos un campo para actualizar",
      }
    ),
});