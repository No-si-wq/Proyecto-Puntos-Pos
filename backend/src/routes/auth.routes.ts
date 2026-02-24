import { Router } from "express";
import {
  login,
  logout,
  logoutGlobal,
  refresh,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  loginSchema,
  refreshSchema,
} from "../validations/auth.schema";

const router = Router();

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.post(
  "/refresh",
  validate(refreshSchema),
  refresh
);

router.post(
  "/logout",
  authMiddleware,
  logout
);

router.post(
  "/logout-global",
  authMiddleware,
  logoutGlobal
);

export default router;