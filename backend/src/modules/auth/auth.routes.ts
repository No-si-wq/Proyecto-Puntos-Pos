import { Router } from "express";
import * as controller from "./auth.controller";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { validate } from "../../core/middlewares/validate.middleware";
import {
  loginSchema,
  refreshSchema,
} from "./auth.schema";

const router = Router();

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(controller.login)
);

router.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(controller.refresh)
);

router.post(
  "/logout",
  authMiddleware,
  asyncHandler(controller.logout)
);

router.post(
  "/logout-global",
  authMiddleware,
  asyncHandler(controller.logoutGlobal)
);

export default router;