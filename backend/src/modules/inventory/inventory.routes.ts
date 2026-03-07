import { Router } from "express";
import * as controller from "./inventory.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  productLotsParamSchema,
  productStockParamSchema,
  inventoryExpiringQuerySchema,
} from "./inventory.schema";
import { requireWarehouse } from "../../core/middlewares/warehouse.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";

const router = Router();

router.use(authMiddleware);
router.use(requireWarehouse);

router.get("/",
  asyncHandler(controller.getInventoryList)
);

router.get(
  "/:productId/stock",
  validate(productStockParamSchema),
  asyncHandler(controller.getStock),
);

router.get(
  "/:productId/lots",
  validate(productLotsParamSchema),
  asyncHandler(controller.getLotsByProduct),
);

router.get(
  "/expiring",
  validate(inventoryExpiringQuerySchema),
  asyncHandler(controller.getExpiringInventory),
)

router.post(
  "/transfer", 
  asyncHandler(controller.transferInventory),
);

export default router;