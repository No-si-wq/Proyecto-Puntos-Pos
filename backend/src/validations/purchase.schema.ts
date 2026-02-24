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
    items: z
      .array(purchaseItemSchema)
      .min(1, "Debe incluir al menos un producto"),
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
