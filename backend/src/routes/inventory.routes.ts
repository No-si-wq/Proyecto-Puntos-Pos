import { Router } from "express";
import * as controller from "../controllers/inventory.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  productLotsParamSchema,
  productStockParamSchema,
  inventoryExpiringQuerySchema,
} from "../validations/inventory.schema";
import { requireWarehouse } from "../middlewares/warehouse.middleware";

const router = Router();

router.use(authMiddleware);
router.use(requireWarehouse);

router.get("/",
  controller.getInventoryList
);

router.get(
  "/:productId/stock",
  validate(productStockParamSchema),
  controller.getStock,
);

router.get(
  "/:productId/lots",
  validate(productLotsParamSchema),
  controller.getLotsByProduct,
);

router.get(
  "/expiring",
  validate(inventoryExpiringQuerySchema),
  controller.getExpiringInventory,
)

router.post(
  "/transfer", 
  controller.transferInventory
);

export default router;