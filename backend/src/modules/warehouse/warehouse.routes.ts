import { Router } from "express";
import * as controller from "./warehouse.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { Role } from "../user/roles";
import { validate } from "../../core/middlewares/validate.middleware";
import * as schema from "./warehouse.schema";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(controller.getWarehouses));
router.get("/:id", asyncHandler(controller.getWarehouse));

router.post(
  "/",
  roleMiddleware(Role.ADMIN),
  validate(schema.createWarehouseSchema),
  asyncHandler(controller.createWarehouse)
);

router.put(
  "/:id",
  roleMiddleware(Role.ADMIN),
  validate(schema.updateWarehouseSchema),
  asyncHandler(controller.updateWarehouse)
);

router.patch(
  "/:id/activate",
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.toggleWarehouseActive)
);

export default router;