import { Router } from "express";
import * as controller from "./inventory.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { requireWarehouse } from "../../core/middlewares/warehouse.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { Role } from "../user/roles";
import * as schema from "./inventory.schema";
import { validate } from "../../core/middlewares/validate.middleware";

const router = Router();

router.use(authMiddleware, requireWarehouse);

router.get(
  "/",
  validate(schema.inventoryListQuerySchema),
  asyncHandler(controller.getInventoryList),
);

router.get(
  "/lots/all",
  asyncHandler(controller.getAllLots),
);

router.get(
  "/:productId/stock",
  validate(schema.productStockParamSchema),
  asyncHandler(controller.getStock),
);

router.get(
  "/:productId/lots",
  validate(schema.productLotsParamSchema),
  asyncHandler(controller.getLotsByProduct),
);

router.get(
  "/expiring",
  validate(schema.inventoryExpiringQuerySchema),
  asyncHandler(controller.getExpiringInventory),
)

router.get(
  "/transfers/report",
  validate(schema.transferReportSchema),
  asyncHandler(controller.getTransferReport)
);

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

router.post(
  "/transfer-warehouse",
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.TransferWarehouse),
);

router.post(
  "/adjust",
  roleMiddleware(Role.ADMIN),
  validate(schema.inventoryAdjustSchema),
  asyncHandler(controller.adjustInventory),
);

export default router;