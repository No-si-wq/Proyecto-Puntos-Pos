import { Router } from "express";
import * as controller from "./supplier.controller";

import { validate } from "../../core/middlewares/validate.middleware";
import * as schema from "./supplier.schema";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { Role } from "../user/roles";

const router = Router();

router.use(authMiddleware)

router.get("/", asyncHandler(controller.listSuppliers));
router.get("/:id", asyncHandler(controller.getSupplier));
router.post("/", validate(schema.createSupplierSchema), asyncHandler(controller.createSupplier));
router.put(
  "/:id", 
  roleMiddleware(Role.ADMIN),
  validate(schema.updateSupplierSchema), 
  asyncHandler(controller.updateSupplier),
);
router.patch(
  "/:id/activate",
  roleMiddleware(Role.ADMIN),
  validate(schema.toggleSupplierSchema),
  asyncHandler(controller.toggleSupplierActive),
);

export default router;