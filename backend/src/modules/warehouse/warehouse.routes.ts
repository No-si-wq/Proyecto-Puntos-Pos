import { Router } from "express";
import * as controller from "./warehouse.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { Role } from "../user/roles";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(controller.getWarehouses));
router.get("/:id", asyncHandler(controller.getWarehouse));

router.post(
  "/",
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.createWarehouse)
);

router.put(
  "/:id",
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.updateWarehouse)
);

router.delete(
  "/:id",
  roleMiddleware(Role.ADMIN),
  asyncHandler(controller.deleteWarehouse)
);

export default router;