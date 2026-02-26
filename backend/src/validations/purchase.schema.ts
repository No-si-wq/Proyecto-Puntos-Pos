import { z } from "zod";

const purchaseItemSchema = z.object({
  productId: z.number().int().positive({
    message: "Producto inválido",
  }),
  quantity: z.number().int().positive({
    message: "Cantidad debe ser mayor a 0",
  }),
  cost: z.number().positive({
    message: "Costo debe ser mayor a 0",
  }),
});

export const createPurchaseSchema = z.object({
  body: z.object({
    supplierId: z.number().int().positive({
      message: "Proveedor inválido",
    }),

    paymentMethod: z.enum([
      "CASH",
      "TRANSFER",
      "CREDIT",
    ]),

    dueDate: z
      .string()
      .datetime({ message: "Fecha inválida" })
      .optional(),

    items: z
      .array(purchaseItemSchema)
      .min(1, "Debe incluir al menos un producto"),
  })
    .superRefine((data, ctx) => {
      if (data.paymentMethod === "CREDIT") {
        if (!data.dueDate) {
          ctx.addIssue({
            path: ["dueDate"],
            code: z.ZodIssueCode.custom,
            message:
              "Fecha de vencimiento requerida para crédito",
          });
        }
      }

      if (
        data.paymentMethod !== "CREDIT" &&
        data.dueDate
      ) {
        ctx.addIssue({
          path: ["dueDate"],
          code: z.ZodIssueCode.custom,
          message:
            "Fecha de vencimiento solo aplica para crédito",
        });
      }
    }),
});

export const purchaseLotsReportSchema = z.object({
  query: z.object({
    days: z.coerce.number().int().positive().optional(),
    expired: z
      .enum(["true", "false"])
      .optional(),
  }),
});