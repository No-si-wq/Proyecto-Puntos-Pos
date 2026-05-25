import { Router } from "express";
import * as controller from "./sale.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { requireWarehouse } from "../../core/middlewares/warehouse.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { validate } from "../../core/middlewares/validate.middleware";
import * as schema from "./sale.schema";
import { Role } from "../user/roles";

const router = Router();

router.use(authMiddleware, requireWarehouse);

router.get("/", 
  roleMiddleware(Role.ADMIN, Role.USER, Role.SELLER),
  asyncHandler(controller.listSales)
);

router.get(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.USER, Role.SELLER),
  validate(schema.saleIdParamSchema),
  asyncHandler(controller.getSale)
);

router.post(
  "/",
  requireWarehouse,
  roleMiddleware(Role.ADMIN, Role.USER, Role.SELLER),
  validate(schema.createSaleSchema),
  asyncHandler(controller.createSale)
);

router.post("/:id/return", asyncHandler(controller.returnItems));

router.post(
  "/:id/cancel",
  roleMiddleware(Role.ADMIN, Role.USER, Role.SELLER),
  asyncHandler(controller.cancelSale)
);

export default router;