import { Router } from "express";
import * as controller from "./bank.controller";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  createBankSchema,
  updateBankSchema,
  bankIdParamSchema,
  toggleBankSchema,
  createBankMovementSchema,
  createBankTransferSchema,
  reconcileBankTransactionsSchema,
  bankStatementQuerySchema,
} from "./bank.schema";

const router = Router();

router.use(authMiddleware);

// Rutas fijas primero para que no colisionen con "/:id"
router.get("/summary", asyncHandler(controller.bankSummary));
router.get("/transactions", asyncHandler(controller.listBankTransactions));
router.post(
  "/transactions/reconcile",
  validate(reconcileBankTransactionsSchema),
  asyncHandler(controller.reconcileBankTransactions)
);
router.post(
  "/transfer",
  validate(createBankTransferSchema),
  asyncHandler(controller.createBankTransfer)
);

router.post("/", validate(createBankSchema), asyncHandler(controller.createBank));
router.get("/", asyncHandler(controller.listBanks));
router.get(
  "/:id/statement",
  validate(bankIdParamSchema),
  validate(bankStatementQuerySchema),
  asyncHandler(controller.getBankStatement)
);
router.get(
  "/:id",
  validate(bankIdParamSchema),
  asyncHandler(controller.getBank)
);
router.patch(
  "/:id",
  validate(bankIdParamSchema),
  validate(updateBankSchema),
  asyncHandler(controller.updateBank)
);
router.patch(
  "/:id/toggle",
  validate(bankIdParamSchema),
  validate(toggleBankSchema),
  asyncHandler(controller.toggleBank)
);
router.post(
  "/:id/movements",
  validate(bankIdParamSchema),
  validate(createBankMovementSchema),
  asyncHandler(controller.createBankMovement)
);

export default router;