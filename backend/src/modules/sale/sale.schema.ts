import { z } from "zod";

export const createSaleSchema = z.object({
  body: z.object({
    customerId:  z.number().int().positive().optional(),
    pointsUsed:  z.number().int().nonnegative().optional(),
    sellerId:    z.number().int().positive().optional(),
    observations: z.string().max(500).optional(),
    priceMode:     z.enum(["TAX_INCLUDED", "TAX_EXCLUDED"]).optional(),

    dueDate: z.string().datetime({ message: "Fecha inválida" }).optional(),

    payments: z.array(
      z.object({
        method: z.enum(["CASH", "CARD", "TRANSFER", "CREDIT"]),
        amount: z.number().positive(),
        reference: z.string().max(100).optional(),
      })
    ).min(1),

    items: z
      .array(
        z.object({
          productId:     z.number().int().positive(),
          quantity:      z.number().int().positive(),
          priceListId:   z.number().int().positive().optional(),
          discountType:  z.enum(["NONE", "PERCENTAGE", "FIXED"]).optional(),
          discountValue: z.number().nonnegative().optional(),
          observations: z.string().max(500).optional(),
          unitPrice:     z.number().positive().optional(),
        })
      )
      .min(1),
    }
  )
  .superRefine((data, ctx) => {
    const hasCredit = data.payments.some(p => p.method === "CREDIT");

    if (hasCredit) {
      if (!data.customerId) {
        ctx.addIssue({ path: ["customerId"], code: z.ZodIssueCode.custom, message: "Cliente requerido para venta a crédito" });
      }
      if (!data.dueDate) {
        ctx.addIssue({ path: ["dueDate"], code: z.ZodIssueCode.custom, message: "Fecha de vencimiento requerida para crédito" });
      }
      if (data.dueDate && new Date(data.dueDate) <= new Date()) {
        ctx.addIssue({ path: ["dueDate"], code: z.ZodIssueCode.custom, message: "La fecha de vencimiento debe ser futura" });
      }

      const creditCount = data.payments.filter(p => p.method === "CREDIT").length;
      if (creditCount > 1) {
        ctx.addIssue({ path: ["payments"], code: z.ZodIssueCode.custom, message: "Solo puede existir un pago a crédito por venta" });
      }
    }

    if (!hasCredit && data.dueDate) {
      ctx.addIssue({ path: ["dueDate"], code: z.ZodIssueCode.custom, message: "Fecha de vencimiento solo aplica para crédito" });
    }
  }),
});

export const saleIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});