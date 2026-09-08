import { z } from "zod";

export const createBankSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nombre muy corto"),
    bankName: z.string().min(2).optional(),
    accountNumber: z.string().min(4).optional(),
    accountType: z.string().min(2).optional(),
    currency: z.string().min(3).max(3).optional(),
  }),
});

export const updateBankSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    bankName: z.string().min(2).optional(),
    accountNumber: z.string().min(4).optional(),
    accountType: z.string().min(2).optional(),
    currency: z.string().min(3).max(3).optional(),
    active: z.boolean().optional(),
  }),
});

export const bankIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID inválido"),
  }),
});

export const toggleBankSchema = z.object({
  body: z.object({
    active: z.boolean(),
  }),
});

export const createBankMovementSchema = z.object({
  body: z.object({
    type: z.enum(["DEPOSIT", "WITHDRAWAL"]),
    amount: z.number().positive("El monto debe ser positivo"),
    description: z.string().min(2).optional(),
  }),
});

export const createBankTransferSchema = z.object({
  body: z.object({
    fromBankId: z.coerce.number().int().positive("Banco de origen inválido"),
    toBankId: z.coerce.number().int().positive("Banco de destino inválido"),
    amount: z.number().positive("El monto debe ser positivo"),
    description: z.string().min(2).optional(),
  }),
});

export const reconcileBankTransactionsSchema = z.object({
  body: z.object({
    transactionIds: z
      .array(z.coerce.number().int().positive())
      .min(1, "Debe seleccionar al menos un movimiento"),
  }),
});