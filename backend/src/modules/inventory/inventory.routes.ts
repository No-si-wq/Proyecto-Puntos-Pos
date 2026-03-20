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
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { Role } from "../user/roles";

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
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.transferInventory),
);

router.post(
  "/transfer-product",
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.TransferProduct),
);

export default router;