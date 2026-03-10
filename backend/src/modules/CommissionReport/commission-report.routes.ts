import { Router } from "express";
import { getCommissionReport } from "./commission-report.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { roleMiddleware } from "../../core/middlewares/role.middleware";
import { Role } from "../user/roles";

const router = Router();

router.use(authMiddleware);

router.get(
  "/", 
  roleMiddleware(Role.ADMIN), 
  getCommissionReport
);

export default router;