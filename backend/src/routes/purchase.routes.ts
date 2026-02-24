import { Router } from "express";
import * as controller from "../controllers/purchase.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireWarehouse } from "../middlewares/warehouse.middleware";
import {
  createPurchaseSchema,
  purchaseLotsReportSchema,
} from "../validations/purchase.schema";

const router = Router();

router.use(authMiddleware);

router.get("/", 
  requireWarehouse, 
  controller.listPurchases);

router.post(
  "/",
  requireWarehouse,
  validate(createPurchaseSchema),
  controller.createPurchase
);

export default router;