import { Router } from "express";
import * as controller from "./purchase.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { requireWarehouse } from "../../core/middlewares/warehouse.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { validate } from "../../core/middlewares/validate.middleware";
import * as schema from "./purchase.schema";

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
  validate(schema.createPurchaseSchema),
  asyncHandler(controller.createPurchase)
);

router.post(
  "/:id/cancel",
  asyncHandler(controller.cancelPurchase),
);

export default router;