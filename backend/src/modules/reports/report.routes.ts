import { Router } from "express";
import * as controller from "./report.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { requireWarehouse } from "../../core/middlewares/warehouse.middleware";

const router = Router();

router.use(authMiddleware);
router.use(requireWarehouse);

router.get("/purchase", asyncHandler(controller.getPurchaseLotsReport));
router.get("/kardex", asyncHandler(controller.getKardex));
router.get("/profit", asyncHandler(controller.getProfitReport));

export default router;