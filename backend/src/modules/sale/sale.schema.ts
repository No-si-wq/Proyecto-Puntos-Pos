import { z } from "zod";

export const createSaleSchema = z.object({
  body: z.object({
    customerId:  z.number().int().positive().optional(),
    pointsUsed:  z.number().int().nonnegative().optional(),
    sellerId:    z.number().int().positive().optional(),
    amountPaid: z.number().nonnegative().optional(),
    observations: z.string().max(500).optional(),
    priceMode:     z.enum(["TAX_INCLUDED", "TAX_EXCLUDED"]).optional(),
    paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "CREDIT"]),

    dueDate: z.string().datetime({ message: "Fecha inválida" }).optional(),

    items: z
      .array(
        z.object({
          productId:     z.number().int().positive(),
          quantity:      z.number().int().positive(),
          priceListId:   z.number().int().positive().optional(),
          discountType:  z.enum(["NONE", "PERCENTAGE", "FIXED"]).optional(),
          discountValue: z.number().nonnegative().optional(),
          observations: z.string().max(500).optional(),
        })
      )
      .min(1),
    }
  )
  .refine(
    (data) => data.paymentMethod !== "CASH" || data.amountPaid === undefined || data.amountPaid >= 0,
    { message: "El monto pagado no puede ser negativo", path: ["amountPaid"] }
  )
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "CREDIT") {
      if (!data.customerId) {
        ctx.addIssue({
          path: ["customerId"],
          code: z.ZodIssueCode.custom,
          message: "Cliente requerido para venta a crédito",
        });
      }

      if (!data.dueDate) {
        ctx.addIssue({
          path: ["dueDate"],
          code: z.ZodIssueCode.custom,
          message: "Fecha de vencimiento requerida para crédito",
        });
      }

      if (data.dueDate && new Date(data.dueDate) <= new Date()) {
        ctx.addIssue({
          path: ["dueDate"],
          code: z.ZodIssueCode.custom,
          message: "La fecha de vencimiento debe ser futura",
        });
      }
    }

    if (data.paymentMethod !== "CREDIT" && data.dueDate) {
      ctx.addIssue({
        path: ["dueDate"],
        code: z.ZodIssueCode.custom,
        message: "Fecha de vencimiento solo aplica para crédito",
      });
    }
  }),
});

export const saleIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});