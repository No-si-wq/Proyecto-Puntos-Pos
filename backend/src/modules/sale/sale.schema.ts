import { z } from "zod";

export const createSaleSchema = z.object({
  body: z.object({
    customerId:  z.number().int().positive().optional(),
    priceListId: z.number().int().positive().optional(),
    pointsUsed:  z.number().int().nonnegative().optional(),

    paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "CREDIT"]),

    dueDate: z.string().datetime({ message: "Fecha inválida" }).optional(),

    items: z
      .array(
        z.object({
          productId:     z.number().int().positive(),
          quantity:      z.number().int().positive(),
          discountType:  z.enum(["NONE", "PERCENTAGE", "FIXED"]).optional(),
          discountValue: z.number().nonnegative().optional(),
        })
      )
      .min(1),
  })
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