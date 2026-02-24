import { Router } from "express";
import * as controller from "../controllers/sale.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { requireWarehouse } from "../middlewares/warehouse.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createSaleSchema,
  saleIdParamSchema,
} from "../validations/sale.schema";
import { Role } from "../types/roles";

const router = Router();

router.use(authMiddleware);

router.get("/", 
  roleMiddleware(Role.ADMIN, Role.USER),
  requireWarehouse,
  controller.listSales);

router.get(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(saleIdParamSchema),
  controller.getSale
);

router.post(
  "/",
  requireWarehouse,
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(createSaleSchema),
  controller.createSale
);

router.post(
  "/:id/cancel",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(saleIdParamSchema),
  controller.cancelSale
);

export default router;