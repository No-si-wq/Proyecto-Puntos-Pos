import { Router } from "express";
import * as controller from "./purchase.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { validate } from "../../core/middlewares/validate.middleware";
import { requireWarehouse } from "../../core/middlewares/warehouse.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import {
  createPurchaseSchema,
} from "./purchase.schema";

const router = Router();

router.use(authMiddleware);
router.use(requireWarehouse);

router.get("/",
  asyncHandler(controller.listPurchases),
);

router.get("/:id",
  asyncHandler(controller.getById),
);

router.post(
  "/",
  validate(createPurchaseSchema),
  asyncHandler(controller.createPurchase)
);

export default router;