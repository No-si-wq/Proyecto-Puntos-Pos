import { Router } from "express";
import * as controller from "./accountReceivable.controller";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authMiddleware } from "../../core/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", asyncHandler(controller.createReceivable));
router.get("/", asyncHandler(controller.listReceivables));
router.get("/:id", asyncHandler(controller.getReceivable));
router.post("/:id/payments", asyncHandler(controller.registerReceivablePayment));
router.get(
  "/customer/:customerId/summary",
  asyncHandler(controller.customerSummary)
);

export default router;