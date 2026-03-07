import { Router } from "express";
import * as controller from "./sale.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { requireWarehouse } from "../../core/middlewares/warehouse.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  createSaleSchema,
  saleIdParamSchema,
} from "./sale.schema";
import { Role } from "../user/roles";

const router = Router();

router.use(authMiddleware);

router.get("/", 
  roleMiddleware(Role.ADMIN, Role.USER),
  requireWarehouse,
  asyncHandler(controller.listSales)
);

router.get(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(saleIdParamSchema),
  asyncHandler(controller.getSale)
);

router.post(
  "/",
  requireWarehouse,
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(createSaleSchema),
  asyncHandler(controller.createSale)
);

router.post(
  "/:id/cancel",
  roleMiddleware(Role.ADMIN, Role.USER),
  validate(saleIdParamSchema),
  asyncHandler(controller.cancelSale)
);

export default router;