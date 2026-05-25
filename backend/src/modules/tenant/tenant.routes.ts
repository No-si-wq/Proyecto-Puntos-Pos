import { Router } from "express";
import { TenantController } from "./tenant.controller";
import { validate } from "../../core/middlewares/validate.middleware";
import { registerTenantSchema } from "./tenant.schema";
import { requireAdmin } from "../../core/middlewares/admin.middleware";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";

const router = Router();

router.get("/config/:key", authMiddleware, requireAdmin, asyncHandler(TenantController.getConfig));
router.put("/config/:key", authMiddleware, requireAdmin, asyncHandler(TenantController.setConfig));

router.post(
  "/register",
  validate(registerTenantSchema),
  asyncHandler(TenantController.register),
);

export default router;