import { Router } from "express";
import * as controller from "./supplier.controller";

import { validate } from "../../core/middlewares/validate.middleware";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "./supplier.schema";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";

const router = Router();

router.use(authMiddleware)

router.get("/", asyncHandler(controller.listSuppliers));
router.get("/:id", asyncHandler(controller.getSupplier));
router.post("/", validate(createSupplierSchema), asyncHandler(controller.createSupplier));
router.put("/:id", validate(updateSupplierSchema), asyncHandler(controller.updateSupplier));

export default router;