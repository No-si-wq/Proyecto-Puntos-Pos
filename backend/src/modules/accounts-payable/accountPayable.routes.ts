import { Router } from "express";
import * as controller from "./accountPayable.controller";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authMiddleware } from "../../core/middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", asyncHandler(controller.createPayable));
router.get("/", asyncHandler(controller.listPayables));
router.post("/:id/payments", asyncHandler(controller.registerPayablePayment));

export default router;